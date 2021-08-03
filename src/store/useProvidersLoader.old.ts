import { RIFScheduler } from "@rsksmart/rif-scheduler-sdk";
import { useEffect } from "react";
import useConnector from "../connect/useConnector";
import environment from "../shared/environment";
import { ENetwork } from "../shared/types";
import useProviders, { IProvider } from "./useProviders.old";

const useProvidersLoader = () => {
  const [isConnected, isLoading, signer] = useConnector((state) => [
    state.isConnected,
    state.isLoading,
    state.signer,
  ]);

  const loadProviders = useProviders((state) => state.load);

  useEffect(() => {
    if (!isConnected || isLoading || !signer) return;

    const providers: IProvider[] = [];

    environment.SCHEDULER_PROVIDERS_TESTNET.forEach((address, index) => {
      providers.push({
        id: `${ENetwork.RSKTestnet}-${address}`,
        name: `RIF Provider #${index + 1}`,
        network: ENetwork.RSKTestnet,
        address,
        rifScheduler: new RIFScheduler({
          contractAddress: address,
          providerOrSigner: signer as any,
          supportedERC677Tokens: environment.ER677_TOKENS,
        }),
        plansPurchaseStatus: [],
      });
    });

    if (providers.length > 0) loadProviders(providers);
  }, [isConnected, isLoading, loadProviders, signer]);
};

export default useProvidersLoader;
