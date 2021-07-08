import { executionFactory, ExecutionState, RIFScheduler } from "@rsksmart/rif-scheduler-sdk";
import { parseISO } from "date-fns";
import { BigNumber, utils } from "ethers";
import create from "zustand";
import { persist } from "zustand/middleware";
import { IContract } from "../contracts/useContracts";
import { IPlan } from "../store/useProviders";
import environment from "../shared/environment";
import getExecutedTransaction from "../shared/getExecutionResult";
import localbasePersist from "../shared/localbasePersist";
import { ENetwork } from "../shared/types";

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
}

export interface IUseSchedule {
  isLoading: boolean;
  scheduleItems: {
    [id: string]: IScheduleItem;
  };
  updateStatus: (
    executionId: string,
    rifScheduler: RIFScheduler
  ) => Promise<void>;
  updateResult: (
    execution: IScheduleItem, 
    contract: IContract,
    plan: IPlan, 
    rifScheduler: RIFScheduler
  ) => Promise<void>;
  scheduleAndSave: (
    scheduleItem: IScheduleItem,
    contract: IContract,
    rifScheduler: RIFScheduler,
    myAccountAddress: string,
    onConfirmed: () => void,
    onFailed: (message: string) => void
  ) => Promise<void>;
}

const useSchedule = create<IUseSchedule>(
  persist(
    (set, get) => ({
      isLoading: false,
      scheduleItems: {},
      updateStatus: async (executionId: string, rifScheduler: RIFScheduler) => {
        set(() => ({
          isLoading: true,
        }));

        const newState = await rifScheduler.getExecutionState(executionId);

        set((state) => ({
          scheduleItems: {
            ...state.scheduleItems,
            [executionId]: {
              ...state.scheduleItems[executionId],
              state: newState,
            },
          },
          isLoading: false,
        }));
      },
      updateResult: async (execution: IScheduleItem, contract: IContract, plan: IPlan, rifScheduler: RIFScheduler) => {
        set(() => ({
          isLoading: true,
        }));

        const executedTransaction = await getExecutedTransaction(
          environment.RIF_SCHEDULER_PROVIDER, 
          rifScheduler.provider as any, 
          plan.window.toNumber(), 
          execution
        )

        const contractInterface = new utils.Interface(
          contract.ABI
        )

        const parsedResult = executedTransaction && execution.state === ExecutionState.ExecutionSuccessful ? 
          contractInterface.decodeFunctionResult(execution.contractMethod, executedTransaction.event.result).join(", ") : 
          executedTransaction?.event.result

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
      scheduleAndSave: async (
        scheduleItem: IScheduleItem,
        contract: IContract,
        rifScheduler: RIFScheduler,
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
        const scheduledExecutionTransaction = await rifScheduler.schedule(
          execution
        );

        scheduledExecutionTransaction
          .wait(environment.REACT_APP_CONFIRMATIONS)
          .then((receipt) => {
            onConfirmed()

            const [executionId] = Object.entries(get().scheduleItems)
              .find(([id, item]) => item.scheduledTx === receipt.transactionHash) ?? []

            if (executionId) {
              get().updateStatus(executionId, rifScheduler)
            }
          })
          .catch(error => onFailed(`Confirmation error: ${error.message}`));

        set((state) => ({
          scheduleItems: {
            ...state.scheduleItems,
            [execution.id]: { ...scheduleItem, id: execution.id, scheduledTx: scheduledExecutionTransaction.hash },
          },
          isLoading: false,
        }));
      },
    }),
    localbasePersist("schedule", ["isLoading"])
  )
);

export default useSchedule;
