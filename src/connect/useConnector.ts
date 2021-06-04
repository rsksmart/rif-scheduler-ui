import create from "zustand";
import { RifScheduler } from "@rsksmart/rif-scheduler-sdk";
import environment from "../shared/environment";
import detectEthereumProvider from "@metamask/detect-provider";
import { providers, Signer } from "ethers";

export interface IUseConnector {
  account: string | undefined;
  provider: providers.Web3Provider | undefined;
  isLoading: boolean;
  isConnected: boolean;
  rifScheduler: RifScheduler | undefined;
  setConnection: (account: string, provider: any) => Promise<void>;
  load: () => Promise<void>;
}

const useConnector = create<IUseConnector>((set, get) => ({
  isLoading: true,
  account: undefined,
  provider: undefined,
  isConnected: false,
  rifScheduler: undefined,
  setConnection: async (account: string, provider: providers.Web3Provider) => {
    const signer: Signer = provider.getSigner(0);

    const rifScheduler = new RifScheduler(
      environment.RIF_ONE_SHOOT_SCHEDULER_PROVIDER,
      signer as any,
      {
        supportedER677Tokens: ["0x19f64674D8a5b4e652319F5e239EFd3bc969a1FE"],
      }
    );

    set((state) => ({
      account,
      provider,
      rifScheduler,
      isConnected: true,
    }));
  },
  load: async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      const web3Provider = new providers.Web3Provider(provider);
      const [account] = await web3Provider.listAccounts();

      if (account) {
        get().setConnection(account, web3Provider);
      }
    }

    set((state) => ({
      isLoading: false,
    }));
  },
}));

export default useConnector;
