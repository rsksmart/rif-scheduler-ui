import create from "zustand";
import { providers, Signer } from "ethers";
import { isRLoginConnected } from "./rLogin";
import { ENetwork, SupportedNetworks } from "../shared/types";

export interface IUseConnector {
  account: string | undefined;
  provider: providers.Web3Provider | undefined;
  signer: Signer | undefined;
  isLoading: boolean;
  network: ENetwork | undefined;
  isConnected: boolean;
  disconnect: () => Promise<void>;
  connect: (rProvider: any, rDisconnect: any) => Promise<void>;
}

const useConnector = create<IUseConnector>((set, get) => ({
  account: undefined,
  provider: undefined,
  signer: undefined,
  isLoading: isRLoginConnected(),
  network: undefined,
  isConnected: false,
  disconnect: async () => {
    localStorage.clear();
    set((state) => ({
      isConnected: false,
      isLoading: false,
    }));
  },
  connect: async (rProvider: any, rDisconnect: any) => {
    try {
      if (!rDisconnect) throw new Error("disconnect functions is empty");

      const web3Provider = new providers.Web3Provider(rProvider);
      const [account] = await web3Provider.listAccounts();
      const signer: Signer = web3Provider.getSigner(0);

      const isConnected = account && signer ? true : false;

      const network = await web3Provider.getNetwork();

      set((state) => ({
        account,
        provider: web3Provider,
        signer: signer,
        disconnect: async () => {
          localStorage.clear();
          set((state) => ({
            isConnected: false,
            isLoading: false,
          }));
          rProvider.removeAllListeners();
          rDisconnect();
        },
        isConnected: isConnected,
        isLoading: false,
        network: network.chainId as ENetwork,
      }));

      const handleConnectionChanges = async (
        rProvider: any,
        chainId: number
      ) => {
        if (!SupportedNetworks.includes(chainId)) {
          set((state) => ({
            network: parseInt(chainId.toString()) as ENetwork,
            isLoading: true,
          }));
          return;
        }

        const web3Provider = new providers.Web3Provider(rProvider);
        const [account] = await web3Provider.listAccounts();
        const signer: Signer = web3Provider.getSigner(0);

        const isConnected = account && signer ? true : false;

        console.log("isConnected", isConnected, account, signer);

        if (!isConnected) {
          get().disconnect();
          return;
        }

        set((state) => ({
          network: parseInt(chainId.toString()) as ENetwork,
          provider: web3Provider,
          signer: signer,
          account: account,
          isConnected: isConnected,
          isLoading: false,
        }));
      };

      // Subscribe to accounts change
      rProvider.on("accountsChanged", (accounts: string[]) => {
        handleConnectionChanges(rProvider, get().network as number);
      });

      // Subscribe to chainId change
      rProvider.on("chainChanged", (chainId: number) => {
        handleConnectionChanges(rProvider, chainId);
      });

      // Subscribe to rProvider connection
      rProvider.on("connect", (info: { chainId: number }) => {
        handleConnectionChanges(rProvider, info.chainId);
      });

      // Subscribe to rProvider disconnection
      rProvider.on("disconnect", (error: { code: number; message: string }) => {
        get().disconnect();
      });
    } catch (error) {
      console.error("connect error: ", error);
      const disconnect = get().disconnect;
      if (disconnect) disconnect();
    }
  },
}));

export default useConnector;
