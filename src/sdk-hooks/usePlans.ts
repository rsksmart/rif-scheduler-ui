import { RIFScheduler } from "@rsksmart/rif-scheduler-sdk";
import { useCallback, useMemo } from "react";
import { createPlanSnapshot, IPlanSnapshot } from "./usePlan";
import { IProviderSnapshot } from "./useProviders";
import shallow from "zustand/shallow";
import create from "zustand";

export interface IUsePlansStore {
  plans: {
    [providerAddress: string]: {
      [index: string]: IPlanSnapshot;
    };
  };
  setPlan: (plan: IPlanSnapshot) => void;
}

export const usePlansStore = create<IUsePlansStore>((set, get) => ({
  plans: {},
  setPlan: (plan: IPlanSnapshot) => {
    const providerAddress = plan.ref.config.contractAddress;

    set((state) => ({
      plans: {
        ...state.plans,
        [providerAddress]: {
          ...state.plans[providerAddress],
          [plan.index.toString()]: plan,
        },
      },
    }));
  },
}));

export const usePlans = (provider: IProviderSnapshot) => {
  const scheduler = useMemo(
    () => new RIFScheduler(provider.config),
    [provider]
  );

  const [plans, setPlan] = usePlansStore(
    (store) => [store.plans[provider.config.contractAddress], store.setPlan],
    shallow
  );

  const loadPlans = useCallback(async () => {
    const plans = await scheduler.getPlans();

    const plansSnapshots = await Promise.all(plans.map(createPlanSnapshot));

    plansSnapshots.forEach(setPlan);
  }, [scheduler, setPlan]);

  return [Object.values(plans ?? []), loadPlans] as const;
};
