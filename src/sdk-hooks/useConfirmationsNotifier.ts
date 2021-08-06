import { providers } from "ethers";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import shallow from "zustand/shallow";
import useConnector from "../connect/useConnector";
import environment from "../shared/environment";
import { ENetwork } from "../shared/types";
import {
  ETransactionStatus,
  ITransaction,
  useTransactionsStore,
} from "./useTransactions";
import { getMessageFromCode } from "eth-rpc-errors";

export interface IConfirmationsNotifierConfig {
  provider: providers.Provider;
  onConfirmed: ((txHash: string) => void) | undefined;
  onFailed: ((txHash: string, error: any) => void) | undefined;
  onCompleted?: ((txHash: string) => void) | undefined;
  tx: ITransaction;
}

export const confirmationsNotifier = ({
  provider,
  onConfirmed,
  onCompleted,
  onFailed,
  tx,
}: IConfirmationsNotifierConfig) => {
  return provider
    .waitForTransaction(tx.hash, environment.CONFIRMATIONS)
    .then(() => {
      if (onConfirmed) onConfirmed(tx.hash);
    })
    .catch((error) => {
      if (onFailed) onFailed(tx.hash, error);
    })
    .finally(() => {
      if (onCompleted) onCompleted(tx.hash);
    });
};

const enqueuedTxs: string[] = [];

export const useConfirmationsNotifier = () => {
  const [isConnected, network, isLoading, signer] = useConnector((state) => [
    state.isConnected,
    state.network,
    state.isLoading,
    state.signer,
  ]);

  const { enqueueSnackbar } = useSnackbar();

  const [transactions, changeStatus] = useTransactionsStore(
    (state) => [state.transactions, state.changeStatus],
    shallow
  );

  useEffect(() => {
    if (
      !isConnected ||
      isLoading ||
      !signer ||
      !network ||
      network === ENetwork.NotSupported
    ) {
      return;
    }

    const pendingTransactions = Object.entries(transactions);

    for (const [key, transactions] of pendingTransactions) {
      const pendingTransactions = transactions.filter((x) =>
        [ETransactionStatus.Idle, ETransactionStatus.Waiting].includes(x.status)
      );

      for (const tx of pendingTransactions) {
        if (enqueuedTxs.includes(tx.hash)) break;

        enqueuedTxs.push(tx.hash);

        confirmationsNotifier({
          provider: signer.provider!,
          tx: tx,
          onConfirmed: () => {
            changeStatus(key, tx.hash, ETransactionStatus.Confirmed);
            enqueueSnackbar(tx.confirmMessage, {
              variant: "success",
            });
          },
          onFailed: (_, error) => {
            const message = getMessageFromCode(error.code, error.message);

            changeStatus(key, tx.hash, ETransactionStatus.Failed, message);
            enqueueSnackbar(tx.failMessage, {
              variant: "error",
            });
          },
        });
      }
    }
  }, [
    isConnected,
    network,
    isLoading,
    signer,
    transactions,
    enqueueSnackbar,
    changeStatus,
  ]);
};
