import { executionFactory, RifScheduler } from "@rsksmart/rif-scheduler-sdk";
import { parseISO } from "date-fns";
import { BigNumber, utils } from "ethers";
import create from "zustand";
import { persist } from "zustand/middleware";
import { IContract } from "../contracts/useContracts";
import { IPlan } from "../providers/useProviders";
import environment from "../shared/environment";
import getExecutionResult from "../shared/getExecutionResult";
import localbasePersist from "../shared/localbasePersist";
import { ENetwork, ExecutionState } from "../shared/types";

export interface IScheduleItem {
  id?: string;
  transactionId?: string;
  title: string;
  network: ENetwork;
  executeAt: string;
  providerId: string;
  providerPlanIndex: number;
  contractId: string;
  contractMethod: string;
  contractFields: string[];
  state?: ExecutionState;
  color?: string;
  result?: string;
}

export interface IUseSchedule {
  isLoading: boolean;
  scheduleItems: {
    [id: string]: IScheduleItem;
  };
  updateStatus: (
    executionId: string,
    rifScheduler: RifScheduler
  ) => Promise<void>;
  updateResult: (
    execution: IScheduleItem, 
    contract: IContract,
    plan: IPlan, 
    rifScheduler: RifScheduler
  ) => Promise<void>;
  scheduleAndSave: (
    scheduleItem: IScheduleItem,
    contract: IContract,
    rifScheduler: RifScheduler,
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
      updateStatus: async (executionId: string, rifScheduler: RifScheduler) => {
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
      updateResult: async (execution: IScheduleItem, contract: IContract, plan: IPlan, rifScheduler: RifScheduler) => {
        set(() => ({
          isLoading: true,
        }));

        const result = await getExecutionResult(
          environment.RIF_SCHEDULER_PROVIDER, 
          rifScheduler.provider, 
          plan.window.toNumber(), 
          execution
        )

        const contractInterface = new utils.Interface(
          contract.ABI
        )

        const parsedResult = result && execution.state === ExecutionState.ExecutionSuccessful ? 
          contractInterface.decodeFunctionResult(execution.contractMethod, result.result).join(", ") : 
          result?.result

        set((state) => ({
          scheduleItems: {
            ...state.scheduleItems,
            [execution.id!]: {
              ...state.scheduleItems[execution.id!],
              result: parsedResult ? parsedResult : "---",
            },
          },
          isLoading: false,
        }));
      },
      scheduleAndSave: async (
        scheduleItem: IScheduleItem,
        contract: IContract,
        rifScheduler: RifScheduler,
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

        let gas = await rifScheduler.estimateGas(
          contract.address,
          encodedFunctionCall
        );

        if (!gas) {
          onFailed("Failed estimating the gas.");
          gas = BigNumber.from("1000000000000000000"); // 1 rBTC
        }

        const execution = executionFactory(
          scheduleItem.providerPlanIndex,
          contract.address,
          encodedFunctionCall,
          gas,
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
              .find(([id, item]) => item.transactionId === receipt.transactionHash) ?? []

            if (executionId) {
              get().updateStatus(executionId, rifScheduler)
            }
          })
          .catch(error => onFailed(`Confirmation error: ${error.message}`));

        set((state) => ({
          scheduleItems: {
            ...state.scheduleItems,
            [execution.id]: { ...scheduleItem, id: execution.id, transactionId: scheduledExecutionTransaction.hash },
          },
          isLoading: false,
        }));
      },
    }),
    localbasePersist("schedule", ["isLoading"])
  )
);

export default useSchedule;
