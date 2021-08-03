import { BigNumber } from "ethers";
import { IPlanPurchaseStatus } from "../store/useProviders.old";
import { IPlanSnapshot } from "../sdk-hooks/usePlan";

export const BIG_ZERO = BigNumber.from(0);

export const executionsLeft = (
  accumulatedPlans: BigNumber | undefined,
  currentPlan: IPlanPurchaseStatus
) => {
  const accumulated = accumulatedPlans ?? BIG_ZERO;

  return accumulated.add(currentPlan.remainingExecutions ?? BIG_ZERO);
};

export const executionsLeft2 = (
  accumulatedPlans: BigNumber | undefined,
  currentPlan: IPlanSnapshot
) => {
  const accumulated = accumulatedPlans ?? BIG_ZERO;

  return accumulated.add(currentPlan.remainingExecutions ?? BIG_ZERO);
};
