import { EExecutionState, Execution } from "@rsksmart/rif-scheduler-sdk";
import { addSeconds, parseISO } from "date-fns";
import { BigNumber, ContractTransaction, utils } from "ethers";
import create from "zustand";
import { persist } from "zustand/middleware";
import { IContract } from "../contracts/useContracts";
import { IPlanPurchaseStatus, IProvider } from "../store/useProviders.old";
import environment from "../shared/environment";
import getExecutedTransaction from "../shared/getExecutionResult";
import localbasePersist from "../shared/localbasePersist";
import { ENetwork, ExecutionStateDescriptions } from "../shared/types";
import { IScheduleFormDialogAlert } from "./ScheduleFormDialog";
import { formatBigNumber, fromBigNumberToHms } from "../shared/formatters";
import { ICronField } from "./cronParser/convertToCronExpression";

export interface IExecutionStatus {
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
  state?: EExecutionState;
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
    [id: string]: IExecutionStatus;
  };
  updateStatus: (executionId: string, provider: IProvider) => Promise<void>;
  updateResult: (
    execution: IExecutionStatus,
    contract: IContract,
    planPurchaseStatus: IPlanPurchaseStatus,
    provider: IProvider
  ) => Promise<void>;
  validateSchedule: (
    scheduleItem: IExecutionStatus,
    contract: IContract,
    provider: IProvider,
    myAccountAddress: string
  ) => Promise<IScheduleFormDialogAlert[]>;
  scheduleAndSave: (
    scheduleItem: IExecutionStatus,
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

        const execution = await provider.rifScheduler.getExecution(executionId);

        const newState = await execution.getState();

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
        execution: IExecutionStatus,
        contract: IContract,
        planPurchaseStatus: IPlanPurchaseStatus,
        provider: IProvider
      ) => {
        set(() => ({
          isLoading: true,
        }));

        const executedTransaction = await getExecutedTransaction(
          provider.address,
          provider.rifScheduler.provider as any,
          planPurchaseStatus.plan.window.toNumber(),
          execution
        );

        const contractInterface = new utils.Interface(contract.ABI);

        const parsedResult =
          executedTransaction &&
          execution.state === EExecutionState.ExecutionSuccessful
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
        scheduleItem: IExecutionStatus,
        contract: IContract,
        provider: IProvider,
        myAccountAddress: string
      ): Promise<IScheduleFormDialogAlert[]> => {
        set(() => ({
          isLoading: true,
        }));

        // TODO: add an input form for this value
        const valueToTransfer = BigNumber.from(0);

        const planPurchaseStatus =
          provider.plansPurchaseStatus[+scheduleItem.providerPlanIndex];

        const result: IScheduleFormDialogAlert[] = [];

        const executionsQuantity = scheduleItem.isRecurrent
          ? +scheduleItem.cronQuantity!
          : 1;

        // validate purchased execution
        const hasAnExecutionLeft =
          planPurchaseStatus.remainingExecutions?.gte(executionsQuantity);
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

        const execution = new Execution(
          provider.rifScheduler.config,
          planPurchaseStatus.plan,
          contract.address,
          encodedFunctionCall,
          parseISO(scheduleItem.executeAt),
          valueToTransfer,
          myAccountAddress
        );

        // if gasEstimation is undefined warn the user that the execution might fail
        const estimatedGas = await execution.estimateGas();
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
        const isInsidePlanGasLimit = planPurchaseStatus.plan.gasLimit.gte(
          estimatedGas ?? 0
        );
        if (estimatedGas && !isInsidePlanGasLimit) {
          result.push({
            message:
              `The selected plan has a gas limit of ${formatBigNumber(
                planPurchaseStatus.plan.gasLimit,
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
        const executions = scheduleItem.isRecurrent
          ? Execution.fromCronExpression(
              execution,
              scheduleItem.cronFields?.expression!,
              +scheduleItem.cronQuantity!
            )
          : [execution];

        const executionsIds = executions.map((x) => x.getId());

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
        scheduleItem: IExecutionStatus,
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

        const planPurchaseStatus =
          provider.plansPurchaseStatus[+scheduleItem.providerPlanIndex];

        const execution = new Execution(
          provider.rifScheduler.config,
          planPurchaseStatus.plan,
          contract.address,
          encodedFunctionCall,
          parseISO(scheduleItem.executeAt),
          valueToTransfer,
          myAccountAddress
        );

        let scheduleTx: ContractTransaction;

        if (scheduleItem.isRecurrent) {
          scheduleTx = (await provider.contractInstance.scheduleMany(
            execution,
            scheduleItem.cronFields!.expression,
            scheduleItem.cronQuantity!
          )) as any;
        } else {
          scheduleTx = (await provider.rifScheduler.schedule(execution)) as any;
        }

        scheduleTx!
          .wait(environment.CONFIRMATIONS)
          .then(() => {
            onConfirmed();
          })
          .catch((error) => onFailed(`Confirmation error: ${error.message}`))
          .finally(() => {
            const executionIds =
              Object.entries(get().scheduleItems).filter(
                ([id, item]) =>
                  item.scheduledTx === scheduleTx!.hash &&
                  item.providerId === scheduleItem.providerId
              ) ?? [];

            for (const [id] of executionIds) {
              get().updateStatus(id, provider);
            }
          });

        const executions = scheduleItem.isRecurrent
          ? Execution.fromCronExpression(
              execution,
              scheduleItem.cronFields?.expression!,
              +scheduleItem.cronQuantity!
            )
          : [execution];

        const executionsToSave = executions.reduce<{
          [id: string]: IExecutionStatus;
        }>((result, execution) => {
          return {
            ...result,
            [execution.getId()]: {
              ...scheduleItem,
              executeAt: execution.executeAt.toISOString(),
              id: execution.getId(),
              scheduledTx: scheduleTx!.hash,
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

        const execution = await provider.rifScheduler.getExecution(executionId);

        const newState = await execution.getState();

        if (newState !== EExecutionState.Scheduled) {
          onFailed(
            `Status must be: ${
              ExecutionStateDescriptions[EExecutionState.Scheduled]
            }. Current Status: ${ExecutionStateDescriptions[newState]}.`
          );
          return;
        }

        const cancelTx = await execution.cancel();

        cancelTx
          .wait(environment.CONFIRMATIONS)
          .then(() => {
            onConfirmed();
          })
          .catch((error) => onFailed(`Confirmation error: ${error.message}`))
          .finally(() => {
            const [executionId] =
              Object.entries(get().scheduleItems).find(
                ([id, item]) =>
                  item.executedTx === cancelTx.hash &&
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
              executedTx: cancelTx.hash,
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

        const execution = await provider.rifScheduler.getExecution(executionId);

        const newState = await execution.getState();

        if (newState !== EExecutionState.Overdue) {
          onFailed(
            `Status must be: ${
              ExecutionStateDescriptions[EExecutionState.Scheduled]
            }. Current Status: ${ExecutionStateDescriptions[newState]}.`
          );
          return;
        }

        const refundTx = await execution.refund();

        refundTx
          .wait(environment.CONFIRMATIONS)
          .then(() => {
            onConfirmed();
          })
          .catch((error) => onFailed(`Confirmation error: ${error.message}`))
          .finally(() => {
            const [executionId] =
              Object.entries(get().scheduleItems).find(
                ([id, item]) =>
                  item.executedTx === refundTx.hash &&
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
              executedTx: refundTx.hash,
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
