import create from "zustand";
import { persist } from "zustand/middleware";
import localbasePersist from "../shared/localbasePersist";
import { ENetwork } from "../shared/types";

export interface IPlan {
  pricePerExecution: number;
  window: number;
  token: string;
  active: boolean;
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
}

const useProviders = create<IUseProviders>(
  persist(
    (set, get) => ({
      providers: {},
      isLoading: false,
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
                window: 10000,
                token: "valid-token-address",
                active: true,
              },
              {
                pricePerExecution: 4,
                window: 300,
                token: "valid-token-address",
                active: true,
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
    localbasePersist("providers")
  )
);

export default useProviders;
