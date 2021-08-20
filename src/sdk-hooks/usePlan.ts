import { Plan, TokenType } from "@rsksmart/rif-scheduler-sdk";
import { BigNumber, BigNumberish } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { usePlansStore } from "./usePlans";
import { useTransactions } from "./useTransactions";

export interface IPlanSnapshot {
  index: BigNumber;
  isActive: boolean;
  window: BigNumber;
  gasLimit: BigNumber;
  pricePerExecution: BigNumber;
  remainingExecutions: BigNumber;
  tokenType: TokenType;
  tokenDecimals: number;
  tokenSymbol: string;
  ref: Plan;
}

export const createPlanSnapshot = async (
  plan: Plan
): Promise<IPlanSnapshot> => {
  const isActive = await plan.isActive();
  const remainingExecutions = await plan.getRemainingExecutions();
  const tokenDecimals = await plan.token.decimals();
  const tokenSymbol = await plan.token.symbol();
  const tokenType = plan.token.getType();

  return {
    index: plan.index,
    isActive,
    window: plan.window,
    gasLimit: plan.gasLimit,
    pricePerExecution: plan.pricePerExecution,
    remainingExecutions,
    tokenType,
    tokenDecimals,
    tokenSymbol,
    ref: plan,
  };
};

export const getPlanKey = (plan: Plan) => {
  return `plan@${plan.config.contractAddress}@${plan.index}`;
};

export const usePlan = (plan: Plan) => {
  const key = getPlanKey(plan);

  const [isConfirmed, setIsConfirmed] = useState<boolean>(true);

  const setPlan = usePlansStore((state) => state.setPlan);

  const [pendingTransactions, registerTx] = useTransactions(key);

  const verifyApproval = async (quantity: BigNumberish) => {
    const amount = plan.pricePerExecution.mul(quantity);

    return plan.token.needsApproval(amount);
  };

  const approve = useCallback(
    async (quantity: BigNumberish) => {
      const amount = plan.pricePerExecution.mul(quantity);

      const tx = await plan.token.approve(amount);

      registerTx(
        tx.hash,
        `Your approve of ${quantity} ${
          quantity > 1 ? "executions" : "execution"
        } was confirmed!`,
        `Your approve of ${quantity} ${
          quantity > 1 ? "executions" : "execution"
        } could not be confirmed.`
      );
    },
    [plan, registerTx]
  );

  const purchase = useCallback(
    async (quantity: BigNumberish) => {
      const tx = await plan.purchase(quantity);

      registerTx(
        tx.hash,
        `Your purchase of ${quantity} ${
          quantity > 1 ? "executions" : "execution"
        } was confirmed!`,
        `Your purchase of ${quantity} ${
          quantity > 1 ? "executions" : "execution"
        } could not be confirmed.`
      );
    },
    [plan, registerTx]
  );

  const refresh = useCallback(async () => {
    return createPlanSnapshot(plan).then((snap) => {
      setPlan(snap);
    });
  }, [plan, setPlan]);

  useEffect(() => {
    const hasPendingTransactions = pendingTransactions.length > 0;

    if (hasPendingTransactions) {
      setIsConfirmed(false);
    } else if (!hasPendingTransactions && !isConfirmed) {
      refresh().then(() => {
        setIsConfirmed(true);
      });
    }
  }, [isConfirmed, pendingTransactions.length, refresh]);

  return [
    verifyApproval,
    approve,
    purchase,
    refresh,
    isConfirmed,
    pendingTransactions,
    key,
  ] as const;
};
