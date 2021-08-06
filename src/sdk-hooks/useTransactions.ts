import { useCallback, useMemo } from "react";
import create from "zustand";
import { persist } from "zustand/middleware";
import shallow from "zustand/shallow";
import useConnector from "../connect/useConnector";
import localbasePersist from "../shared/localbasePersist";
import { ENetwork } from "../shared/types";

export enum ETransactionStatus {
  Idle,
  Waiting,
  Failed,
  Confirmed,
}

export interface ITransaction {
  network: ENetwork;
  hash: string;
  status: ETransactionStatus;
  confirmMessage: string;
  failMessage: string;
  startedAt: string;
  errorMessage?: string;
}

export interface IUseTransactionsStore {
  transactions: {
    [key: string]: ITransaction[];
  };
  register: (key: string, tx: ITransaction) => void;
  changeStatus: (
    key: string,
    txHash: string,
    status: ETransactionStatus,
    errorMessage?: string
  ) => void;
}

export const useTransactionsStore = create<IUseTransactionsStore>(
  persist(
    (set, get) => ({
      transactions: {},
      register: (key: string, tx: ITransaction) => {
        const result = (get().transactions[key] ?? []).filter(
          (x) => x.hash !== tx.hash
        );

        set((state) => ({
          transactions: {
            ...state.transactions,
            [key]: [...result, tx],
          },
        }));
      },
      changeStatus: (
        key: string,
        txHash: string,
        status: ETransactionStatus,
        errorMessage?: string
      ) => {
        let transactionToChange = (get().transactions[key] ?? []).find(
          (x) => x.hash === txHash
        );

        if (transactionToChange) {
          transactionToChange.status = status;
          transactionToChange.errorMessage = errorMessage;

          const result = (get().transactions[key] ?? []).filter(
            (x) => x.hash !== txHash
          );

          set((state) => ({
            transactions: {
              ...state.transactions,
              [key]: [...result, transactionToChange!],
            },
          }));
        }
      },
    }),
    localbasePersist("transactions")
  )
);

export const useTransactions = (key: string) => {
  const connectedToNetwork = useConnector((state) => state.network);

  const [transactions, registerIntoStore] = useTransactionsStore(
    (state) => [state.transactions, state.register],
    shallow
  );

  const transactionsFilteredByKey = useMemo(
    () => transactions[key] ?? [],
    [key, transactions]
  );

  const pendingTransactions = transactionsFilteredByKey.filter((x) =>
    [ETransactionStatus.Idle, ETransactionStatus.Waiting].includes(x.status)
  );

  const register = useCallback(
    (txHash: string, confirmMessage: string, failMessage) => {
      registerIntoStore(key, {
        hash: txHash,
        network: connectedToNetwork!,
        status: ETransactionStatus.Idle,
        confirmMessage,
        failMessage,
        startedAt: new Date().toISOString(),
      });
    },
    [connectedToNetwork, key, registerIntoStore]
  );

  return [pendingTransactions, register] as const;
};
