import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { RifScheduler } from "@rsksmart/rif-scheduler-sdk";
import { IPlanResponse } from "@rsksmart/rif-scheduler-sdk/dist/types";
import create from "zustand";
import { persist } from "zustand/middleware";
import environment from "../shared/environment";
import localbasePersist from "../shared/localbasePersist";
import { ENetwork } from "../shared/types";

export interface IPlan extends IPlanResponse {
  remainingExecutions: BigNumber | null;
  symbol: string;
  decimals: number;
}

export interface IProvider {
  id: string;
  name: string;
  network: ENetwork;
  address: string;
  plans: IPlan[];
}

export interface IUseProviders {
  providers: {
    [id: string]: IProvider;
  };
  isLoading: boolean;
  load: (rifScheduler: RifScheduler) => Promise<void>;
  purchaseExecutions: (
    provider: IProvider,
    planIndex: number,
    executionsAmount: number,
    rifScheduler: RifScheduler
  ) => Promise<void>;
}

const useProviders = create<IUseProviders>(
  persist(
    (set, get) => ({
      providers: {},
      isLoading: false,
      purchaseExecutions: async (
        provider: IProvider,
        planIndex: number,
        executionsQuantity: number,
        rifScheduler: RifScheduler
      ) => {
        set(() => ({
          isLoading: true,
        }));
        
        const purchaseTransaction = await rifScheduler.purchasePlan(
          planIndex,
          executionsQuantity
        );

        await purchaseTransaction.wait(environment.REACT_APP_CONFIRMATIONS);

        const result = { ...provider, plans: [...provider.plans] };
        result.plans[planIndex].remainingExecutions =
          await rifScheduler.remainingExecutions(planIndex);

        set((state) => ({
          providers: { ...state.providers, [result.id]: result },
          isLoading: false,
        }));
      },
      load: async (rifScheduler: RifScheduler) => {
        set(() => ({
          isLoading: true,
        }));

        const contractAddress = environment.RIF_SCHEDULER_PROVIDER;

        const provider: IProvider = {
          id: `${ENetwork.RSKTestnet}-${contractAddress}`,
          name: "Rif Provider",
          network: ENetwork.RSKTestnet,
          address: contractAddress,
          plans: [],
        };

        const plansCount = await rifScheduler.getPlansCount();
        for (let index = 0; plansCount.gt(index); index++) {
          const plan = await rifScheduler.getPlan(index);

          let remainingExecutions = null;
          if (rifScheduler.signer) {
            remainingExecutions = await rifScheduler.remainingExecutions(index);
          }

          const tokenContract = new Contract(
            plan.token,
            [
              "function symbol() view returns (string)",
              "function decimals() view returns (uint8)",
            ],
            rifScheduler.provider
          );
          const tokenSymbol = await tokenContract.symbol();
          const tokenDecimals = await tokenContract.decimals();

          provider.plans.push({
            ...plan,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            remainingExecutions,
          });
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
