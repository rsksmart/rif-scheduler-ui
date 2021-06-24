import { executionFactory, RIFScheduler } from "@rsksmart/rif-scheduler-sdk";
import { parseISO } from "date-fns";
import { BigNumber, utils } from "ethers";
import create from "zustand";
import { persist } from "zustand/middleware";
import { IContract } from "../contracts/useContracts";
import environment from "../shared/environment";
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
