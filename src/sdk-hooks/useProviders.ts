import { Config } from "@rsksmart/rif-scheduler-sdk/dist/Base";
import { Signer } from "ethers";
import { useEffect } from "react";
import create from "zustand";
import useConnector from "../connect/useConnector";
import environment from "../shared/environment";
import { ENetwork } from "../shared/types";

export interface IProviderSnapshot {
  index: number;
  network: ENetwork;
  config: Config;
}

export interface IUseProvidersStore {
  providers: IProviderSnapshot[];
  setProviders: (providers: IProviderSnapshot[]) => void;
}

export const useProvidersStore = create<IUseProvidersStore>((set, get) => ({
  providers: [],
  setProviders: (providers: IProviderSnapshot[]) => {
    set((state) => ({
      providers,
    }));
  },
}));

export const createProviderSnapshot = (
  index: number,
  address: string,
  network: ENetwork,
  signer: Signer
): IProviderSnapshot => {
  return {
    index,
    network: network,
    config: {
      contractAddress: address,
      providerOrSigner: signer as any,
      supportedERC677Tokens: environment.ER677_TOKENS,
    },
  };
};

export const useProvidersLoader = () => {
  const [isConnected, network, isLoading, signer] = useConnector((state) => [
    state.isConnected,
    state.network,
    state.isLoading,
    state.signer,
  ]);

  const setProviders = useProvidersStore((state) => state.setProviders);

  useEffect(() => {
    if (
      !isConnected ||
      isLoading ||
      !signer ||
      !network ||
      network === ENetwork.NotSupported
    ) {
      return;
    }

    const providerAddresses =
      network === ENetwork.RSKMainnet
        ? environment.SCHEDULER_PROVIDERS_MAINNET
        : environment.SCHEDULER_PROVIDERS_TESTNET;

    const providers = providerAddresses.map((address, index) =>
      createProviderSnapshot(index, address, network, signer)
    );

    setProviders(providers);
  }, [isConnected, network, isLoading, signer, setProviders]);
};
