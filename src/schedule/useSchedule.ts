import { executionFactory, ExecutionState } from "@rsksmart/rif-scheduler-sdk";
import { parseISO } from "date-fns";
import { BigNumber, utils } from "ethers";
import create from "zustand";
import { persist } from "zustand/middleware";
import { IContract } from "../contracts/useContracts";
import { IPlan, IProvider } from "../store/useProviders";
import environment from "../shared/environment";
import getExecutedTransaction from "../shared/getExecutionResult";
import localbasePersist from "../shared/localbasePersist";
import { ENetwork, ExecutionStateDescriptions } from "../shared/types";
import { IScheduleFormDialogAlert } from "./ScheduleFormDialog";
import { formatBigNumber } from "../shared/formatters";

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

        const selectedPlan = provider.plans[+scheduleItem.providerPlanIndex];

        // validate enough balance to schedule
        // validate minimum date/time

        const result: IScheduleFormDialogAlert[] = [];

        // validate purchased execution
        const hasAnExecutionLeft = selectedPlan.remainingExecutions?.gt(0);
        if (!hasAnExecutionLeft) {
          result.push({
            message: "You don't have executions left",
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
          provider.address,
          encodedFunctionCall
        );
        if (!estimatedGas) {
          result.push({
            message:
              "We couldn't estimate the gas for the execution you want to schedule. " +
              "Hint: Make sure that all the parameters are correct and " +
              "that you will have every execution requirement at the time of its execution.",
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
        const scheduledExecutionTransaction =
          await provider.contractInstance.schedule(execution);

        scheduledExecutionTransaction
          .wait(environment.CONFIRMATIONS)
          .then(() => {
            onConfirmed();
          })
          .catch((error) => onFailed(`Confirmation error: ${error.message}`))
          .finally(() => {
            const [executionId] =
              Object.entries(get().scheduleItems).find(
                ([id, item]) =>
                  item.scheduledTx === scheduledExecutionTransaction.hash
              ) ?? [];

            if (executionId) {
              get().updateStatus(executionId, provider);
            }
          });

        set((state) => ({
          scheduleItems: {
            ...state.scheduleItems,
            [execution.id]: {
              ...scheduleItem,
              id: execution.id,
              scheduledTx: scheduledExecutionTransaction.hash,
            },
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
                ([id, item]) => item.executedTx === cancelTransaction.hash
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
                ([id, item]) => item.executedTx === refundTransaction.hash
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
