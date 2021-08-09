import { Execution, RIFScheduler } from "@rsksmart/rif-scheduler-sdk";
import { useCallback } from "react";
import { useProvidersStore } from "./useProviders";
import shallow from "zustand/shallow";
import create from "zustand";
import useContracts from "../contracts/useContracts";
import { ContractTransaction, utils } from "ethers";
import { parseISO } from "date-fns";
import { persist } from "zustand/middleware";
import localbasePersist from "../shared/localbasePersist";
import {
  createExecutionSnapshot,
  getExecutionKey,
  getExecutionScheduleKey,
  IExecutionSnapshot,
} from "./useExecution";
import useConnector from "../connect/useConnector";
import { ETransactionStatus, useTransactionsStore } from "./useTransactions";
import { ENetwork } from "../shared/types";

export interface IExecutionIndex {
  id?: string;
  title: string;
  network: ENetwork;
  contractId: string;
  contractMethod: string;
  contractFields: string[];
  color: string;
  executeAtISO: string;
  providerAddress: string;
  providerPlanIndex: string;
  value: string;
  requestor: string;
  isRecurrent: boolean;
  cronExpression?: string;
  quantity?: string;
  scheduledTxHash?: string;
  completedTxHash?: string;
  result?: string;
}

export interface IUseIndexedExecutions {
  indexedExecutions: {
    [key: string]: IExecutionIndex;
  };
  setIndexedExecution: (key: string, indexedExecution: IExecutionIndex) => void;
}

export const useIndexedExecutionsStore = create<IUseIndexedExecutions>(
  persist(
    (set, get) => ({
      indexedExecutions: {},
      setIndexedExecution: (key: string, indexedExecution: IExecutionIndex) => {
        set((state) => ({
          indexedExecutions: {
            ...state.indexedExecutions,
            [key]: indexedExecution,
          },
        }));
      },
    }),
    localbasePersist("indexed-executions")
  )
);

export interface IUseExecutionsStore {
  executions: {
    [key: string]: IExecutionSnapshot;
  };
  setExecution: (key: string, execution: IExecutionSnapshot) => void;
}

export const useExecutionsStore = create<IUseExecutionsStore>((set, get) => ({
  executions: {},
  setExecution: (key: string, execution: IExecutionSnapshot) => {
    set((state) => ({
      executions: {
        ...state.executions,
        [key]: execution,
      },
    }));
  },
}));

export const useExecutions = () => {
  const contracts = useContracts((state) => state.contracts);

  const providers = useProvidersStore((state) => state.providers);

  const connectedToNetwork = useConnector((state) => state.network);

  const registerTxWithKey = useTransactionsStore((state) => state.register);

  const [indexedExecutions, setIndexedExecution] = useIndexedExecutionsStore(
    (store) => [store.indexedExecutions, store.setIndexedExecution],
    shallow
  );

  const [executions, setExecution] = useExecutionsStore(
    (store) => [store.executions, store.setExecution],
    shallow
  );

  const getExecution = useCallback(
    async (index: IExecutionIndex) => {
      const contract = contracts[index.contractId];
      const provider = providers.find(
        (x) => x.config.contractAddress === index.providerAddress
      );

      if (!contract || !provider) {
        return null;
      }

      const scheduler = new RIFScheduler(provider.config);

      const plan = await scheduler.getPlan(index.providerPlanIndex);

      const encodedFunctionCall = new utils.Interface(
        contract.ABI
      ).encodeFunctionData(index.contractMethod, index.contractFields);

      return new Execution(
        provider.config,
        plan,
        contract.address,
        encodedFunctionCall,
        parseISO(index.executeAtISO),
        index.value,
        index.requestor
      );
    },
    [contracts, providers]
  );

  const loadExecutions = useCallback(async () => {
    for (const index of Object.values(indexedExecutions)) {
      const execution = await getExecution(index);

      if (!execution) continue;

      const executionSnapshot = await createExecutionSnapshot(execution, index);

      const key = getExecutionKey(execution);

      setExecution(key, executionSnapshot);
    }
  }, [getExecution, indexedExecutions, setExecution]);

  const schedule = useCallback(
    async (index: IExecutionIndex) => {
      const provider = providers.find(
        (x) => x.config.contractAddress === index.providerAddress
      );

      if (!provider) throw new Error("Could not find the provider.");

      const scheduler = new RIFScheduler(provider.config);

      const execution = await getExecution(index);

      let tx: ContractTransaction;

      if (!execution)
        throw new Error(
          "Something went wrong, please check all your data and try again."
        );

      if (index.isRecurrent) {
        const executions = Execution.fromCronExpression(
          execution,
          index.cronExpression!,
          index.quantity!
        );
        tx = (await scheduler.scheduleMany(executions)) as any;

        for (const current of executions) {
          const key = getExecutionKey(current);

          setIndexedExecution(key, {
            ...index,
            id: current.getId(),
            scheduledTxHash: tx.hash,
            executeAtISO: current.executeAt.toISOString(),
          });
        }
      } else {
        tx = (await scheduler.schedule(execution)) as any;

        const key = getExecutionKey(execution);

        setIndexedExecution(key, {
          ...index,
          id: execution.getId(),
          scheduledTxHash: tx.hash,
        });
      }

      const scheduleKey = getExecutionScheduleKey(
        index.providerAddress,
        tx.hash
      );

      registerTxWithKey(scheduleKey, {
        hash: tx.hash,
        network: connectedToNetwork!,
        status: ETransactionStatus.Idle,
        confirmMessage: `Your "${index.title}" execution was confirmed!`,
        failMessage: `Your "${index.title}" execution could not be confirmed.`,
        startedAt: new Date().toISOString(),
      });
    },
    [
      connectedToNetwork,
      getExecution,
      providers,
      registerTxWithKey,
      setIndexedExecution,
    ]
  );

  return [Object.values(executions), loadExecutions, schedule] as const;
};
