import { BigNumber } from "ethers";
import { Plan, RIFScheduler } from "@rsksmart/rif-scheduler-sdk";
import create from "zustand";
import environment from "../shared/environment";
import { ENetwork } from "../shared/types";

export interface IPlanPurchaseStatus {
  isActive: boolean;
  remainingExecutions: BigNumber | null;
  isPurchaseConfirmed: boolean;
  tokenDecimals: number;
  tokenSymbol: string;
  plan: Plan;
}

export interface IProvider {
  id: string;
  name: string;
  network: ENetwork;
  address: string;
  rifScheduler: RIFScheduler;
  plansPurchaseStatus: IPlanPurchaseStatus[];
}

export interface IUseProviders {
  providers: {
    [id: string]: IProvider;
  };
  isLoading: boolean;
  load: (providers: IProvider[]) => Promise<void>;
  purchaseExecutions: (
    providerId: string,
    planIndex: BigNumber,
    executionsAmount: number,
    onConfirmed: () => void,
    onFailed: (message: string) => void
  ) => Promise<void>;
  updateRemainingExecutions: (
    providerId: string,
    planIndex: BigNumber,
    isPurchaseConfirmed?: boolean
  ) => Promise<void>;
}

const useProviders = create<IUseProviders>((set, get) => ({
  providers: {},
  isLoading: false,
  updateRemainingExecutions: async (
    providerId: string,
    planIndex: BigNumber,
    isPurchaseConfirmed?: boolean
  ) => {
    const provider = get().providers[providerId];
    const planPurchaseStatus =
      provider.plansPurchaseStatus[+planIndex.toString()];

    const remainingExecutions =
      await planPurchaseStatus?.plan.getRemainingExecutions();

    const result = {
      ...provider,
      planPurchaseStatus: [...provider.plansPurchaseStatus],
    };
    result.plansPurchaseStatus[+planIndex.toString()].remainingExecutions =
      remainingExecutions;

    if (isPurchaseConfirmed !== undefined) {
      result.planPurchaseStatus[+planIndex.toString()].isPurchaseConfirmed =
        isPurchaseConfirmed;
    }

    set((state) => ({
      providers: { ...state.providers, [result.id]: result },
    }));
  },
  purchaseExecutions: async (
    providerId: string,
    planIndex: BigNumber,
    executionsQuantity: number,
    onConfirmed: () => void,
    onFailed: (message: string) => void
  ) => {
    set((state) => ({
      isLoading: true,
    }));

    const provider = get().providers[providerId];
    const planPurchaseStatus =
      provider.plansPurchaseStatus[+planIndex.toString()];

    const purchaseTransaction = await planPurchaseStatus.plan.purchase(
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
        plansPurchaseStatus: [],
      };

      const plansCount = await provider.rifScheduler.getPlansCount();

      for (let index = 0; plansCount.gt(index); index++) {
        const plan = await provider.rifScheduler.getPlan(index);
        const isActive = await plan.isActive();
        const tokenDecimals = await plan.token.decimals();
        const tokenSymbol = await plan.token.symbol();

        let remainingExecutions = null;
        if (provider.rifScheduler.signer) {
          remainingExecutions = await plan.getRemainingExecutions();
        }

        storeProvider.plansPurchaseStatus.push({
          plan,
          remainingExecutions,
          isActive,
          tokenDecimals,
          tokenSymbol,
          isPurchaseConfirmed: true,
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
