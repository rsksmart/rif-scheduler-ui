import { RIFScheduler } from "@rsksmart/rif-scheduler-sdk";
import { useEffect } from "react";
import useConnector from "../connect/useConnector";
import environment from "../shared/environment";
import { ENetwork } from "../shared/types";
import useProviders, { IProvider } from "./useProviders";

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

    environment.SCHEDULER_PROVIDERS.forEach((address, index) => {
      providers.push({
        id: `${ENetwork.RSKTestnet}-${address}`,
        name: `RIF Provider #${index + 1}`,
        network: ENetwork.RSKTestnet,
        address,
        contractInstance: new RIFScheduler(address, signer as any, {
          supportedER677Tokens: environment.ER677_TOKENS,
        }),
        plans: [],
      });
    });

    if (providers.length > 0) loadProviders(providers);
  }, [isConnected, isLoading, loadProviders, signer]);
};

export default useProvidersLoader;
