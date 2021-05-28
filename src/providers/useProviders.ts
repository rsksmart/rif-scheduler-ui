import { BigNumber } from "@ethersproject/bignumber";
import { RifScheduler } from "@rsksmart/rif-scheduler-sdk";
import { IPlan } from "@rsksmart/rif-scheduler-sdk/dist/types";
import create from "zustand";
import { persist } from "zustand/middleware";
import environment from "../shared/environment";
import localbasePersist from "../shared/localbasePersist";
import { ENetwork } from "../shared/types";

export interface IPlanWithExecutions extends IPlan {
  remainingExecutions: number;
}

export interface IProvider {
  id: string;
  name: string;
  network: ENetwork;
  address: string;
  plans: IPlanWithExecutions[];
}

export interface IUseProviders {
  providers: {
    [id: string]: IProvider;
  };
  isLoading: boolean;
  load: (rifScheduler: RifScheduler) => Promise<void>;
  purchaseExecutions: (
    provider: IProvider,
    plan: number,
    executionsAmount: number
  ) => Promise<void>;
}

const useProviders = create<IUseProviders>(
  persist(
    (set, get) => ({
      providers: {},
      isLoading: false,
      purchaseExecutions: async (
        provider: IProvider,
        plan: number,
        executionsAmount: number
      ) => {
        set(() => ({
          isLoading: true,
        }));

        setTimeout(() => {
          // TODO: use the sdk to purchase more executions

          const result = { ...provider, plans: [...provider.plans] };

          result.plans[plan].remainingExecutions += executionsAmount;

          set((state) => ({
            providers: { ...state.providers, [result.id]: result },
            isLoading: false,
          }));
        }, 1000);
      },
      load: async (rifScheduler: RifScheduler) => {
        set(() => ({
          isLoading: true,
        }));

        const contractAddress = environment.RIF_ONE_SHOOT_SCHEDULER_PROVIDER;

        const provider: IProvider = {
          id: `${ENetwork.Testnet}-${contractAddress}`,
          name: "Rif Provider",
          network: ENetwork.Testnet,
          address: contractAddress,
          plans: [],
        };

        let keepLoadingPlans = true;
        let index = 0;
        while (keepLoadingPlans) {
          try {
            const plan = await rifScheduler.getPlan(index);
            const remainingExecutions = await rifScheduler.remainingExecutions(
              BigNumber.from(index)
            );

            provider.plans.push({ ...plan, remainingExecutions });

            index++;
          } catch (error) {
            // TODO: change this when getPlansLength exist in the sdk
            console.log("provider", rifScheduler, error, index);
            keepLoadingPlans = false;
          }
        }

        set((state) => ({
          providers: { ...state.providers, [provider.id]: provider },
          isLoading: false,
        }));
      },
    }),
    localbasePersist("providers", ["isLoading"])
  )
);

export default useProviders;
