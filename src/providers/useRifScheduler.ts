import { RIFScheduler } from "@rsksmart/rif-scheduler-sdk";
import useConnector from "../connect/useConnector";
import environment from "../shared/environment";

const useRIFScheduler = () => {
    const [isConnected, isLoading, signer] = useConnector(state => [state.isConnected, state.isLoading, state.signer])

    if (!isConnected || isLoading || !signer)
        return null

    const rifScheduler = new RifScheduler(
        environment.RIF_SCHEDULER_PROVIDER,
        signer,
        {
            supportedER677Tokens: environment.REACT_APP_ER677_TOKENS,
        }
    );

    return rifScheduler
}

export default useRIFScheduler