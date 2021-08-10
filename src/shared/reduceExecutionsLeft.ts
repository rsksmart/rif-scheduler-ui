import { BigNumber } from "ethers";
import { IPlanSnapshot } from "../sdk-hooks/usePlan";

export const BIG_ZERO = BigNumber.from(0);

export const executionsLeft = (
  accumulatedPlans: BigNumber | undefined,
  currentPlan: IPlanSnapshot
) => {
  const accumulated = accumulatedPlans ?? BIG_ZERO;

  return accumulated.add(currentPlan.remainingExecutions ?? BIG_ZERO);
};
