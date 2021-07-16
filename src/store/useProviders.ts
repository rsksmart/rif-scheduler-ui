import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { RIFScheduler } from "@rsksmart/rif-scheduler-sdk";
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
  contractInstance: RIFScheduler;
  plans: IPlan[];
}

export interface IUseProviders {
  providers: {
    [id: string]: IProvider;
  };
  isLoading: boolean;
  load: (providers: IProvider[]) => Promise<void>;
  purchaseExecutions: (
    providerId: string,
    planIndex: number,
    executionsAmount: number,
    onConfirmed: () => void,
    onFailed: (message: string) => void
  ) => Promise<void>;
  updateRemainingExecutions: (
    providerId: string,
    planIndex: number,
    isPurchaseConfirmed?: boolean
  ) => Promise<void>;
}

const useProviders = create<IUseProviders>((set, get) => ({
  providers: {},
  isLoading: false,
  updateRemainingExecutions: async (
    providerId: string,
    planIndex: number,
    isPurchaseConfirmed?: boolean
  ) => {
    const provider = get().providers[providerId];

    const remainingExecutions =
      await provider.contractInstance.remainingExecutions(planIndex);

    const result = { ...provider, plans: [...provider.plans] };
    result.plans[planIndex].remainingExecutions = remainingExecutions;

    if (isPurchaseConfirmed !== undefined) {
      result.plans[planIndex].isPurchaseConfirmed = isPurchaseConfirmed;
    }

    set((state) => ({
      providers: { ...state.providers, [result.id]: result },
    }));
  },
  purchaseExecutions: async (
    providerId: string,
    planIndex: number,
    executionsQuantity: number,
    onConfirmed: () => void,
    onFailed: (message: string) => void
  ) => {
    set((state) => ({
      isLoading: true,
    }));

    const provider = get().providers[providerId];

    const purchaseTransaction = await provider.contractInstance.purchasePlan(
      planIndex,
      executionsQuantity
    );

    get().updateRemainingExecutions(providerId, planIndex, false);

    purchaseTransaction
      .wait(environment.CONFIRMATIONS)
      .then(async (receipt) => {
        onConfirmed();
      })
      .catch((error) => onFailed(`Confirmation error: ${error.message}`))
      .finally(() =>
        get().updateRemainingExecutions(providerId, planIndex, true)
      );

    set((state) => ({
      isLoading: false,
    }));
  },
  load: async (providers: IProvider[]) => {
    set(() => ({
      isLoading: true,
    }));

    for (const provider of providers) {
      const storeProvider: IProvider = {
        ...provider,
        plans: [],
      };

      const plansCount = await provider.contractInstance.getPlansCount();

      for (let index = 0; plansCount.gt(index); index++) {
        const plan = await provider.contractInstance.getPlan(index);

        let remainingExecutions = null;
        if (provider.contractInstance.signer) {
          remainingExecutions =
            await provider.contractInstance.remainingExecutions(index);
        }

        const tokenContract = new Contract(
          plan.token,
          [
            "function symbol() view returns (string)",
            "function decimals() view returns (uint8)",
          ],
          provider.contractInstance.provider as any
        );
        const tokenSymbol = await tokenContract.symbol();
        const tokenDecimals = await tokenContract.decimals();

        storeProvider.plans.push({
          ...plan,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          remainingExecutions,
          isPurchaseConfirmed: true,
          index,
        });

        set((state) => ({
          providers: { ...state.providers, [storeProvider.id]: storeProvider },
        }));
      }
    }

    set((state) => ({
      isLoading: false,
    }));
  },
}));

export default useProviders;
