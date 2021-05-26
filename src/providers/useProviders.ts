import create from "zustand";
import { persist } from "zustand/middleware";
import localbasePersist from "../shared/localbasePersist";
import { ENetwork } from "../shared/types";

export interface IPlan {
  pricePerExecution: number;
  window: number;
  token: string;
  active: boolean;
  remainingExecutions: number;
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
  load: () => Promise<void>;
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
      load: async () => {
        set(() => ({
          isLoading: true,
        }));

        setTimeout(() => {
          const contractAddress = "0x6d9b00d599662b00af45b63c34ff4bd07ae42de8";

          // TODO: use the sdk to get all plans
          const provider: IProvider = {
            id: `${ENetwork.Testnet}-${contractAddress}`,
            name: "Rif Provider",
            network: ENetwork.Testnet,
            address: contractAddress,
            plans: [
              {
                pricePerExecution: 3,
                window: 9000,
                token: "valid-token-address",
                active: true,
                remainingExecutions: 0,
              },
              {
                pricePerExecution: 4,
                window: 300,
                token: "valid-token-address",
                active: true,
                remainingExecutions: 0,
              },
            ],
          };

          set((state) => ({
            providers: { ...state.providers, [provider.id]: provider },
            isLoading: false,
          }));
        }, 1000);
      },
    }),
    localbasePersist("providers", ["isLoading"])
  )
);

export default useProviders;
