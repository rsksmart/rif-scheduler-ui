import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { RIFScheduler } from "@rsksmart/rif-scheduler-sdk/dist";
import { IPlanResponse } from "@rsksmart/rif-scheduler-sdk/dist/types";
import create from "zustand";
import environment from "../shared/environment";
import { ENetwork } from "../shared/types";

export interface IPlan extends IPlanResponse {
  remainingExecutions: BigNumber | null;
  symbol: string;
  decimals: number;
  isPurchaseConfirmed: boolean;
  index: number;
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
  load: (rifScheduler: RIFScheduler) => Promise<void>;
  purchaseExecutions: (
    providerId: string,
    planIndex: number,
    executionsAmount: number,
    rifScheduler: RIFScheduler,
    onConfirmed: () => void,
    onFailed: (message: string) => void
  ) => Promise<void>;
  updateRemainingExecutions: (
    providerId: string,
    planIndex: number,
    rifScheduler: RIFScheduler,
    isPurchaseConfirmed?: boolean,
  ) => Promise<void>;
}

const useProviders = create<IUseProviders>(
    (set, get) => ({
      providers: {},
      isLoading: false,
      updateRemainingExecutions: async (
        providerId: string,
        planIndex: number,
        rifScheduler: RIFScheduler,
        isPurchaseConfirmed?: boolean,
      ) => {
        const remainingExecutions = await rifScheduler.remainingExecutions(planIndex)

        const provider = get().providers[providerId]

        const result = { ...provider, plans: [...provider.plans] };
        result.plans[planIndex].remainingExecutions = remainingExecutions
        
        if (isPurchaseConfirmed !== undefined) {
          result.plans[planIndex].isPurchaseConfirmed = isPurchaseConfirmed
        }

        set((state) => ({
          providers: { ...state.providers, [result.id]: result }
        }));
      },
      purchaseExecutions: async (
        providerId: string,
        planIndex: number,
        executionsQuantity: number,
        rifScheduler: RIFScheduler,
        onConfirmed: () => void,
        onFailed: (message: string) => void
      ) => {
        set((state) => ({
          isLoading: true,
        }));

        // const plan = get().providers[providerId].plans[planIndex]

        // const approveTransaction = await rifScheduler.approveToken(plan.token, plan.pricePerExecution.mul(executionsQuantity))

        // await approveTransaction.wait(environment.REACT_APP_CONFIRMATIONS)

        const purchaseTransaction = await rifScheduler.purchasePlan(
          planIndex,
          executionsQuantity
        );

        get().updateRemainingExecutions(providerId, planIndex, rifScheduler, false)

        purchaseTransaction
          .wait(environment.REACT_APP_CONFIRMATIONS)
          .then(async (receipt) => {
            onConfirmed()
          })
          .catch(error => onFailed(`Confirmation error: ${error.message}`))
          .finally(() => get().updateRemainingExecutions(providerId, planIndex, rifScheduler, true));

        set((state) => ({
          isLoading: false,
        }));
      },
      load: async (rifScheduler: RIFScheduler) => {
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

        const plansCount = await rifScheduler.getPlansCount()

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
            rifScheduler.provider as any
          );
          const tokenSymbol = await tokenContract.symbol();
          const tokenDecimals = await tokenContract.decimals();

          provider.plans.push({
            ...plan,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            remainingExecutions,
            isPurchaseConfirmed: true,
            index
          });
        }

        set((state) => ({
          providers: { ...state.providers, [provider.id]: provider },
          isLoading: false,
        }));
      },
    })
);

export default useProviders;
