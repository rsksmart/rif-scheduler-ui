import { RifScheduler } from "@rsksmart/rif-scheduler-sdk";
import useConnector from "../connect/useConnector";
import environment from "../shared/environment";

const useRifScheduler = () => {
    const signer = useConnector(state => state.signer)

    if (!signer)
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

export default useRifScheduler