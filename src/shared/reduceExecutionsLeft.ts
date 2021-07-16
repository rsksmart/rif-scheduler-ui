import { BigNumber } from "ethers";
import { IPlan } from "../store/useProviders";

export const BIG_ZERO = BigNumber.from(0);

export const executionsLeft = (
  accumulatedPlans: BigNumber | undefined,
  currentPlan: IPlan
) => {
  const accumulated = accumulatedPlans ?? BIG_ZERO;

  return accumulated.add(currentPlan.remainingExecutions ?? BIG_ZERO);
};
