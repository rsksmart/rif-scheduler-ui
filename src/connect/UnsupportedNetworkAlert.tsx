import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import useConnector from "./useConnector";
import { ENetwork, SupportedNetworks } from "../shared/types";
import Typography from "@material-ui/core/Typography";
import NetworkLabel from "./NetworkLabel";
import UnsupportedNetwork from "../assets/illustrations/UnsupportedNetwork";

const UnsupportedNetworkAlert = () => {
    const theme = useTheme();

    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const [connectedToNetwork, isConnected] = useConnector(state => [state.network, state.isConnected]) 

    const open = isConnected && !SupportedNetworks.includes(connectedToNetwork ?? ENetwork.NotSupported)

    return (
      <Dialog
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth={true}
        open={open}
      >
        <DialogTitle>
          Unsupported network
        </DialogTitle>
        <DialogContent>
          <div style={{display:"flex", flex:1}}>
            <UnsupportedNetwork style={{height:200, padding:16}} />
          </div>
          <Typography variant="subtitle1" color="textSecondary" component="p">
            You are connected to an incorrect network.
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" component="p">
            Please change your wallet to one of the following networks:
          </Typography>
          <div style={{display:"flex", gap: "5px", marginTop: 24, marginBottom: 16}}>
            {SupportedNetworks.map((network) =>
              <NetworkLabel key={`supported-network-${network}`} network={network} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
}

export default UnsupportedNetworkAlert