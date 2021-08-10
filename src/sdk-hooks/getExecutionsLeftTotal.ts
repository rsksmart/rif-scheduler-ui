import { RIFScheduler } from "@rsksmart/rif-scheduler-sdk";
import { BIG_ZERO } from "../shared/reduceExecutionsLeft";
import { IProviderSnapshot } from "./useProviders";

export const getExecutionsLeftTotal = async (
  providers: IProviderSnapshot[]
) => {
  let result = BIG_ZERO;
  for (const provider of providers) {
    const scheduler = new RIFScheduler(provider.config);

    const plans = await scheduler.getPlans();

    const remainingExecutions = await Promise.all(
      plans.map((plan) => plan.getRemainingExecutions())
    );

    const left = remainingExecutions.reduce((total, remainingExecution) => {
      return total.add(remainingExecution);
    }, BIG_ZERO);

    result = result.add(left);
  }

  return result;
};
