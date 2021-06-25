import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';
import NetworkLabel from "../connect/NetworkLabel";
import useSchedule from "./useSchedule";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import useContracts from "../contracts/useContracts";
import useProviders from "../providers/useProviders";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import StatusLabel from "./StatusLabel";
import { format, parseISO } from "date-fns";
import hyphensAndCamelCaseToWords from "../shared/hyphensAndCamelCaseToWords";
import shortAddress from "../shared/shortAddress";
import IconButton from '@material-ui/core/IconButton';
import CopyIcon from '@material-ui/icons/FileCopy';
import { useSnackbar } from "notistack";
import { getExplorerTxLink } from "../shared/types";
import useConnector from "../connect/useConnector";
import Link from "@material-ui/core/Link";
import LinkIcon from '@material-ui/icons/Launch';
import RefreshIcon from '@material-ui/icons/Refresh';
import useRifScheduler from "../providers/useRifScheduler";
import shallow from "zustand/shallow";
import { fromBigNumberToHms } from "../shared/formatters";

const rowStyles = {display:"flex", alignItems:"center", gap: "5px"}

const ExecutionInfo = ({ selectedExecutionId, onClose }: { selectedExecutionId: string | null, onClose: () => void }) => {
    const theme = useTheme();
    
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
    
    const open = selectedExecutionId ? true : false
    
    const [scheduleItems, updateStatus, isLoading] = 
        useSchedule((state) => [state.scheduleItems, state.updateStatus, state.isLoading], shallow);
    const providers = useProviders((state) => state.providers);
    const contracts = useContracts((state) => state.contracts);  
    
    const rifScheduler = useRifScheduler();

    const { enqueueSnackbar } = useSnackbar();

    const connectedToNetwork = useConnector(state => state.network)

    if (!selectedExecutionId) return null

    const handleCopy = (textToCopy: string | undefined | null) => () => {
        if (!textToCopy) {
            return;
        }

        if (!navigator?.clipboard) {
          enqueueSnackbar("Your browser can't access the clipboard", {
            variant: "error",
          });
          return;
        }
    
        navigator.clipboard.writeText(textToCopy);
        enqueueSnackbar("Copied!");
    };

    const handleUpdateStatusClick = () => {
        if (!rifScheduler) return;

        updateStatus(selectedExecutionId, rifScheduler);
    };

    const execution = scheduleItems[selectedExecutionId]
    const provider = providers[execution.providerId]
    const contract = contracts[execution.contractId]
    const plan = provider.plans[execution.providerPlanIndex]

    const explorerAddressUrl = execution.transactionId && connectedToNetwork &&
        getExplorerTxLink(execution.transactionId, connectedToNetwork)

    return (
      <Dialog
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth={true}
        open={open}
        onClose={onClose}
      >
        <DialogTitle>
          <div style={{display:"flex", flex:1}}>
            <div style={{display:"flex", flex:1}}>{execution.title}</div>
            <NetworkLabel />
          </div>
        </DialogTitle>
        <DialogContent>
            <TableContainer component={Paper} elevation={0} style={{ border: `1px solid ${theme.palette.action.hover}` }}>
                <Table aria-label="info table">
                    <TableBody>
                        <StyledTableRow>
                            <StrongTableCell component="th" scope="row">
                                #
                            </StrongTableCell>
                            <RegularTableCell align="right" style={rowStyles}>
                                <IconButton aria-label="copy id" size="small" onClick={handleCopy(execution.id)}>
                                    <CopyIcon fontSize="inherit" />
                                </IconButton>
                                <span>{execution.id && shortAddress(execution.id)}</span>
                            </RegularTableCell>
                        </StyledTableRow>
                        <StyledTableRow>
                            <StrongTableCell component="th" scope="row">
                                Transaction
                            </StrongTableCell>
                            <RegularTableCell align="right" style={rowStyles}>
                                <IconButton aria-label="copy transaction hash" size="small" onClick={handleCopy(execution.transactionId)}>
                                    <CopyIcon fontSize="inherit" />
                                </IconButton>
                                {explorerAddressUrl && 
                                <Link target="_blank" href={explorerAddressUrl} rel="noreferrer" style={rowStyles}>
                                    <LinkIcon style={{fontSize:16}} />
                                    {execution.transactionId && shortAddress(execution.transactionId)}
                                </Link>}
                                {!explorerAddressUrl && 
                                <span>
                                    {execution.transactionId && shortAddress(execution.transactionId)}
                                </span>}
                            </RegularTableCell>
                        </StyledTableRow>
                        <StyledTableRow>
                            <StrongTableCell component="th" scope="row">
                                Status
                            </StrongTableCell>
                            <RegularTableCell align="right" style={rowStyles}>
                                <IconButton 
                                    aria-label="refresh status" 
                                    size="small" 
                                    onClick={handleUpdateStatusClick}
                                    disabled={isLoading}
                                >
                                    <RefreshIcon fontSize="inherit" />
                                </IconButton>
                                <StatusLabel state={execution.state} isLoading={isLoading} />
                            </RegularTableCell>
                        </StyledTableRow>
                        <StyledTableRow>
                            <StrongTableCell component="th" scope="row">
                                Execute at
                            </StrongTableCell>
                            <RegularTableCell align="right">
                                {format(parseISO(execution.executeAt), "MMMM do yyyy, hh:mm aaa")}
                            </RegularTableCell>
                        </StyledTableRow>
                        <StyledTableRow>
                            <StrongTableCell component="th" scope="row">
                                Execution window
                            </StrongTableCell>
                            <RegularTableCell align="right">
                                {fromBigNumberToHms(plan.window)}
                            </RegularTableCell>
                        </StyledTableRow>
                        <StyledTableRow>
                            <StrongTableCell component="th" scope="row">
                                {provider.name}
                            </StrongTableCell>
                            <RegularTableCell align="right">
                                {contract.name}&nbsp;&#10140;&nbsp;
                                {hyphensAndCamelCaseToWords(execution.contractMethod)}
                            </RegularTableCell>
                        </StyledTableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </DialogContent>
        <DialogActions
          style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 24 }}
        >
          <Button onClick={onClose} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
}

export default ExecutionInfo

const RegularTableCell = withStyles((theme: Theme) =>
  createStyles({
    head: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
    },
    body: {
      fontSize: 14,
      borderBottom: "none"
    },
  }),
)(TableCell);

const StrongTableCell = withStyles((theme: Theme) =>
  createStyles({
    head: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
    },
    body: {
      fontSize: 14,
      fontWeight: "bold",
      borderBottom: "none",
      maxWidth: 100
    },
  }),
)(TableCell);

const StyledTableRow = withStyles((theme: Theme) =>
  createStyles({
    root: {
      '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
      },
    },
  }),
)(TableRow);