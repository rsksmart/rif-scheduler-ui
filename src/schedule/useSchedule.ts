import { executionFactory, ExecutionState } from "@rsksmart/rif-scheduler-sdk";
import { addSeconds, parseISO } from "date-fns";
import { BigNumber, ContractTransaction, utils } from "ethers";
import create from "zustand";
import { persist } from "zustand/middleware";
import { IContract } from "../contracts/useContracts";
import { IPlan, IProvider } from "../store/useProviders";
import environment from "../shared/environment";
import getExecutedTransaction from "../shared/getExecutionResult";
import localbasePersist from "../shared/localbasePersist";
import { ENetwork, ExecutionStateDescriptions } from "../shared/types";
import { IScheduleFormDialogAlert } from "./ScheduleFormDialog";
import { formatBigNumber, fromBigNumberToHms } from "../shared/formatters";
import getDatesFromCronExpression from "../shared/getDatesFromCronExpression";
import { ICronField } from "./cronParser/convertToCronExpression";

export interface IScheduleItem {
  id?: string;
  scheduledTx?: string;
  title: string;
  network: ENetwork;
  executeAt: string;
  providerId: string;
  providerPlanIndex: string;
  contractId: string;
  contractMethod: string;
  contractFields: string[];
  state?: ExecutionState;
  color?: string;
  result?: string;
  executedTx?: string;
  isConfirmed?: boolean;
  isRecurrent?: boolean;
  cronFields?: ICronField;
  cronQuantity?: string;
}

export interface IUseSchedule {
  isLoading: boolean;
  scheduleItems: {
    [id: string]: IScheduleItem;
  };
  updateStatus: (executionId: string, provider: IProvider) => Promise<void>;
  updateResult: (
    execution: IScheduleItem,
    contract: IContract,
    plan: IPlan,
    provider: IProvider
  ) => Promise<void>;
  validateSchedule: (
    scheduleItem: IScheduleItem,
    contract: IContract,
    provider: IProvider,
    myAccountAddress: string
  ) => Promise<IScheduleFormDialogAlert[]>;
  scheduleAndSave: (
    scheduleItem: IScheduleItem,
    contract: IContract,
    provider: IProvider,
    myAccountAddress: string,
    onConfirmed: () => void,
    onFailed: (message: string) => void
  ) => Promise<void>;
  cancelExecution: (
    executionId: string,
    provider: IProvider,
    onConfirmed: () => void,
    onFailed: (message: string) => void
  ) => Promise<void>;
  refundExecution: (
    executionId: string,
    provider: IProvider,
    onConfirmed: () => void,
    onFailed: (message: string) => void
  ) => Promise<void>;
}

const useSchedule = create<IUseSchedule>(
  persist(
    (set, get) => ({
      isLoading: false,
      scheduleItems: {},
      updateStatus: async (executionId: string, provider: IProvider) => {
        set(() => ({
          isLoading: true,
        }));

        const newState = (await provider.contractInstance.getExecutionState(
          executionId
        )) as ExecutionState;

        set((state) => ({
          scheduleItems: {
            ...state.scheduleItems,
            [executionId]: {
              ...state.scheduleItems[executionId],
              isConfirmed: true,
              state: newState,
            },
          },
          isLoading: false,
        }));
      },
      updateResult: async (
        execution: IScheduleItem,
        contract: IContract,
        plan: IPlan,
        provider: IProvider
      ) => {
        set(() => ({
          isLoading: true,
        }));

        const executedTransaction = await getExecutedTransaction(
          provider.address,
          provider.contractInstance.provider as any,
          plan.window.toNumber(),
          execution
        );

        const contractInterface = new utils.Interface(contract.ABI);

        const parsedResult =
          executedTransaction &&
          execution.state === ExecutionState.ExecutionSuccessful
            ? contractInterface
                .decodeFunctionResult(
                  execution.contractMethod,
                  executedTransaction.event.result
                )
                .join(", ")
            : executedTransaction?.event.result;

        set((state) => ({
          scheduleItems: {
            ...state.scheduleItems,
            [execution.id!]: {
              ...state.scheduleItems[execution.id!],
              executedTx: executedTransaction?.txHash,
              result: parsedResult,
            },
          },
          isLoading: false,
        }));
      },
      validateSchedule: async (
        scheduleItem: IScheduleItem,
        contract: IContract,
        provider: IProvider,
        myAccountAddress: string
      ): Promise<IScheduleFormDialogAlert[]> => {
        set(() => ({
          isLoading: true,
        }));

        // TODO: add an input form for this value
        const valueToTransfer = BigNumber.from(0);

        const selectedPlan = provider.plans[+scheduleItem.providerPlanIndex];

        const result: IScheduleFormDialogAlert[] = [];

        const executionsQuantity = scheduleItem.isRecurrent
          ? +scheduleItem.cronQuantity!
          : 1;

        // validate purchased execution
        const hasAnExecutionLeft =
          selectedPlan.remainingExecutions?.gte(executionsQuantity);
        if (!hasAnExecutionLeft) {
          result.push({
            message: `You don't have ${formatBigNumber(
              BigNumber.from(executionsQuantity),
              0
            )} ${executionsQuantity === 1 ? "execution" : "executions"} left`,
            severity: "error",
            actionLabel: "Purchase more",
            actionLink: "/store",
          });
        }

        const encodedFunctionCall = new utils.Interface(
          contract.ABI
        ).encodeFunctionData(
          scheduleItem.contractMethod,
          scheduleItem.contractFields
        );

        // if gasEstimation is undefined warn the user that the execution might fail
        const estimatedGas = await provider.contractInstance.estimateGas(
          contract.address,
          encodedFunctionCall
        );
        if (!estimatedGas) {
          result.push({
            message:
              "We couldn't estimate the gas for the execution you want to schedule. " +
              "Hint: Make sure that all the parameters are correct and " +
              "that you will comply the execution requirements at the time of its execution.",
            severity: "warning",
          });
        }

        // estimatedGas is lower than the gas limit for the selected plan
        const isInsidePlanGasLimit = selectedPlan.gasLimit.gte(
          estimatedGas ?? 0
        );
        if (estimatedGas && !isInsidePlanGasLimit) {
          result.push({
            message:
              `The selected plan has a gas limit of ${formatBigNumber(
                selectedPlan.gasLimit,
                0
              )} which is lower that ` +
              `our estimation for this execution (${formatBigNumber(
                estimatedGas,
                0
              )}).`,
            severity: "warning",
          });
        }

        // validate minimum date/time
        const minimumDate = addSeconds(
          new Date(),
          environment.MINIMUM_TIME_BEFORE_EXECUTION
        );

        if (parseISO(scheduleItem.executeAt) <= minimumDate) {
          result.push({
            message: `You need to schedule at least ${fromBigNumberToHms(
              BigNumber.from(environment.MINIMUM_TIME_BEFORE_EXECUTION)
            )} in advance.`,
            severity: "error",
          });
        }

        // validate existing scheduled execution
        const executionDates = scheduleItem.isRecurrent
          ? getDatesFromCronExpression(
              scheduleItem.executeAt,
              scheduleItem.cronFields?.expression!,
              +scheduleItem.cronQuantity!
            )
          : [scheduleItem.executeAt];

        const executionsIds = executionDates.map((executeAt) => {
          const executionRelated = executionFactory(
            scheduleItem.providerPlanIndex,
            contract.address,
            encodedFunctionCall,
            parseISO(executeAt),
            valueToTransfer,
            myAccountAddress
          );

          return executionRelated.id;
        });

        const existing =
          Object.entries(get().scheduleItems).find(
            ([id, item]) =>
              executionsIds.includes(id) &&
              item.providerId === scheduleItem.providerId
          ) ?? [];

        if (existing.length > 0) {
          const message = scheduleItem.isRecurrent
            ? "One or more executions are already scheduled."
            : "This execution is already scheduled";

          result.push({
            message: message,
            severity: "error",
          });
        }

        set(() => ({
          isLoading: false,
        }));

        return result;
      },
      scheduleAndSave: async (
        scheduleItem: IScheduleItem,
        contract: IContract,
        provider: IProvider,
        myAccountAddress: string,
        onConfirmed: () => void,
        onFailed: (message: string) => void
      ) => {
        set(() => ({
          isLoading: true,
        }));

        const encodedFunctionCall = new utils.Interface(
          contract.ABI
        ).encodeFunctionData(
          scheduleItem.contractMethod,
          scheduleItem.contractFields
        );

        // TODO: add an input form for this value
        const valueToTransfer = BigNumber.from(0);

        const execution = executionFactory(
          scheduleItem.providerPlanIndex,
          contract.address,
          encodedFunctionCall,
          parseISO(scheduleItem.executeAt),
          valueToTransfer,
          myAccountAddress
        );

        let scheduledExecutionTransaction: ContractTransaction;

        if (scheduleItem.isRecurrent) {
          scheduledExecutionTransaction =
            (await provider.contractInstance.scheduleMany(
              execution,
              scheduleItem.cronFields!.expression,
              scheduleItem.cronQuantity!
            )) as any;
        } else {
          scheduledExecutionTransaction =
            (await provider.contractInstance.schedule(execution)) as any;
        }

        scheduledExecutionTransaction!
          .wait(environment.CONFIRMATIONS)
          .then(() => {
            onConfirmed();
          })
          .catch((error) => onFailed(`Confirmation error: ${error.message}`))
          .finally(() => {
            const executionIds =
              Object.entries(get().scheduleItems).filter(
                ([id, item]) =>
                  item.scheduledTx === scheduledExecutionTransaction!.hash &&
                  item.providerId === scheduleItem.providerId
              ) ?? [];

            for (const [id] of executionIds) {
              get().updateStatus(id, provider);
            }
          });

        const executionDates = scheduleItem.isRecurrent
          ? getDatesFromCronExpression(
              scheduleItem.executeAt,
              scheduleItem.cronFields?.expression!,
              +scheduleItem.cronQuantity!
            )
          : [scheduleItem.executeAt];

        const executionsToSave = executionDates.reduce<{
          [id: string]: IScheduleItem;
        }>((result, executeAt) => {
          const executionRelated = executionFactory(
            scheduleItem.providerPlanIndex,
            contract.address,
            encodedFunctionCall,
            parseISO(executeAt),
            valueToTransfer,
            myAccountAddress
          );

          return {
            ...result,
            [executionRelated.id]: {
              ...scheduleItem,
              executeAt: executeAt,
              id: executionRelated.id,
              scheduledTx: scheduledExecutionTransaction!.hash,
            },
          };
        }, {});

        set((state) => ({
          scheduleItems: {
            ...state.scheduleItems,
            ...executionsToSave,
          },
          isLoading: false,
        }));
      },
      cancelExecution: async (
        executionId: string,
        provider: IProvider,
        onConfirmed: () => void,
        onFailed: (message: string) => void
      ) => {
        set(() => ({
          isLoading: true,
        }));

        const newState = (await provider.contractInstance.getExecutionState(
          executionId
        )) as ExecutionState;

        if (newState !== ExecutionState.Scheduled) {
          onFailed(
            `Status must be: ${
              ExecutionStateDescriptions[ExecutionState.Scheduled]
            }. Current Status: ${ExecutionStateDescriptions[newState]}.`
          );
          return;
        }

        const cancelTransaction =
          await provider.contractInstance.cancelExecution(executionId);

        cancelTransaction
          .wait(environment.CONFIRMATIONS)
          .then(() => {
            onConfirmed();
          })
          .catch((error) => onFailed(`Confirmation error: ${error.message}`))
          .finally(() => {
            const [executionId] =
              Object.entries(get().scheduleItems).find(
                ([id, item]) =>
                  item.executedTx === cancelTransaction.hash &&
                  item.providerId === provider.id
              ) ?? [];

            if (executionId) {
              get().updateStatus(executionId, provider);
            }
          });

        set((state) => ({
          scheduleItems: {
            ...state.scheduleItems,
            [executionId]: {
              ...state.scheduleItems[executionId],
              state: newState,
              isConfirmed: false,
              executedTx: cancelTransaction.hash,
            },
          },
          isLoading: false,
        }));
      },
      refundExecution: async (
        executionId: string,
        provider: IProvider,
        onConfirmed: () => void,
        onFailed: (message: string) => void
      ) => {
        set(() => ({
          isLoading: true,
        }));

        const newState = (await provider.contractInstance.getExecutionState(
          executionId
        )) as ExecutionState;

        if (newState !== ExecutionState.Overdue) {
          onFailed(
            `Status must be: ${
              ExecutionStateDescriptions[ExecutionState.Scheduled]
            }. Current Status: ${ExecutionStateDescriptions[newState]}.`
          );
          return;
        }

        const refundTransaction =
          await provider.contractInstance.requestExecutionRefund(executionId);

        refundTransaction
          .wait(environment.CONFIRMATIONS)
          .then(() => {
            onConfirmed();
          })
          .catch((error) => onFailed(`Confirmation error: ${error.message}`))
          .finally(() => {
            const [executionId] =
              Object.entries(get().scheduleItems).find(
                ([id, item]) =>
                  item.executedTx === refundTransaction.hash &&
                  item.providerId === provider.id
              ) ?? [];

            if (executionId) {
              get().updateStatus(executionId, provider);
            }
          });

        set((state) => ({
          scheduleItems: {
            ...state.scheduleItems,
            [executionId]: {
              ...state.scheduleItems[executionId],
              state: newState,
              isConfirmed: false,
              executedTx: refundTransaction.hash,
            },
          },
          isLoading: false,
        }));
      },
    }),
    localbasePersist("schedule", ["isLoading"])
  )
);

export default useSchedule;
