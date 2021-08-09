import { EExecutionState, Execution } from "@rsksmart/rif-scheduler-sdk";
import { BigNumber, utils } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import useContracts from "../contracts/useContracts";
import getExecutedTransaction from "../shared/getExecutionResult";
import { IExecutionIndex, useExecutionsStore } from "./useExecutions";
import { useTransactions } from "./useTransactions";

export interface IExecutionSnapshot {
  index: IExecutionIndex;
  id: string;
  executeAt: Date;
  value: BigNumber;
  state: EExecutionState;
  ref: Execution;
}

export const createExecutionSnapshot = async (
  execution: Execution,
  index: IExecutionIndex
): Promise<IExecutionSnapshot> => {
  const state = await execution.getState();
  const id = execution.getId();

  return {
    index,
    id,
    state,
    executeAt: execution.executeAt,
    value: execution.value,
    ref: execution,
  };
};

export const getExecutionKey = (execution: Execution) => {
  return `execution@${execution.config.contractAddress}@${execution.getId()}`;
};

export const getExecutionScheduleKey = (
  providerAddress: string,
  scheduleHash: string
) => {
  return `execution@schedule@${providerAddress}@${scheduleHash}`;
};

export const useExecution = (execution: Execution, index: IExecutionIndex) => {
  const key = getExecutionKey(execution);
  const scheduleKey = getExecutionScheduleKey(
    index.providerAddress,
    index.scheduledTxHash ?? "not-scheduled"
  );

  const contracts = useContracts((state) => state.contracts);
  const contract = contracts[index.contractId];

  const [isConfirmed, setIsConfirmed] = useState<boolean>(true);

  const setExecution = useExecutionsStore((state) => state.setExecution);

  const [pendingScheduleTransactions] = useTransactions(scheduleKey);
  const [pendingExecutionTransactions, registerTx] = useTransactions(key);
  const pendingTransactions = useMemo(
    () => pendingScheduleTransactions.concat(pendingExecutionTransactions),
    [pendingScheduleTransactions, pendingExecutionTransactions]
  );

  const refresh = useCallback(async () => {
    return createExecutionSnapshot(execution, index).then((snap) => {
      setExecution(key, snap);
    });
  }, [execution, index, key, setExecution]);

  const cancel = useCallback(async () => {
    const tx = await execution.cancel();

    registerTx(
      tx.hash,
      `Your "${index.title}" execution was cancelled!`,
      `Your "${index.title}" execution could not be cancelled.`
    );
  }, [execution, index.title, registerTx]);

  const refund = useCallback(async () => {
    const tx = await execution.refund();

    registerTx(
      tx.hash,
      `Your "${index.title}" execution was refunded!`,
      `Your "${index.title}" execution could not be refunded.`
    );
  }, [execution, index.title, registerTx]);

  const locateResult = useCallback(async () => {
    if (!index.scheduledTxHash || !contract) return;

    const executedTransaction = await getExecutedTransaction(
      index.scheduledTxHash,
      execution
    );

    const contractInterface = new utils.Interface(contract.ABI);

    const state = await execution.getState();

    const parsedResult =
      executedTransaction && state === EExecutionState.ExecutionSuccessful
        ? contractInterface
            .decodeFunctionResult(
              index.contractMethod,
              executedTransaction.event.result
            )
            .join(", ")
        : executedTransaction?.event.result;

    createExecutionSnapshot(execution, index).then((snap) => {
      setExecution(key, {
        ...snap,
        index: {
          ...snap.index,
          result: parsedResult,
          completedTxHash: executedTransaction?.txHash,
        },
      });
    });
  }, [contract, execution, index, key, setExecution]);

  useEffect(() => {
    const hasPendingTransactions = pendingTransactions.length > 0;

    if (hasPendingTransactions) {
      setIsConfirmed(false);
    } else if (!hasPendingTransactions && !isConfirmed) {
      createExecutionSnapshot(execution, index).then((snap) => {
        setExecution(key, snap);
        setIsConfirmed(true);
      });
    }
  }, [isConfirmed, pendingTransactions, execution, setExecution, index, key]);

  return [
    refresh,
    cancel,
    refund,
    locateResult,
    contract,
    isConfirmed,
    pendingTransactions,
    key,
  ] as const;
};
