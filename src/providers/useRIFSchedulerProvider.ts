import { RIFScheduler } from "@rsksmart/rif-scheduler-sdk";
import useConnector from "../connect/useConnector";
import environment from "../shared/environment";

const useRIFSchedulerProvider = () => {
    const [isConnected, isLoading, signer] = useConnector(state => [state.isConnected, state.isLoading, state.signer])

    if (!isConnected || isLoading || !signer)
        return null

    const rifScheduler = new RIFScheduler(
        environment.RIF_SCHEDULER_PROVIDER,
        signer as any,
        {
            supportedER677Tokens: environment.REACT_APP_ER677_TOKENS,
        }
    );

    return rifScheduler
}

export default useRIFSchedulerProvider