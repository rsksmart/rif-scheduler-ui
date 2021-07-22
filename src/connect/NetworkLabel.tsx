import useConnector from "./useConnector"
import Chip from '@material-ui/core/Chip';
import { ENetwork, NetworkName } from "../shared/types";

// By default shows the connected network
const NetworkLabel = ({ network }: { network?: ENetwork }) => {
    const connectedToNetwork = useConnector(state => state.network)

    const displayNetwork = network ? network : connectedToNetwork

    let color = "default"

    color = displayNetwork === ENetwork.RSKMainnet ? "primary" : color
    color = displayNetwork === ENetwork.RSKTestnet ? "secondary" : color

    const label = displayNetwork ? NetworkName[displayNetwork] : NetworkName[ENetwork.NotSupported]

    return <Chip size="small" color={color as any} label={label ?? NetworkName[ENetwork.NotSupported]} />
}

export default NetworkLabel