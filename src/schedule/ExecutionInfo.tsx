import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { withStyles, Theme, createStyles } from "@material-ui/core/styles";
import NetworkLabel from "../connect/NetworkLabel";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import StatusLabel from "./StatusLabel";
import { format } from "date-fns";
import hyphensAndCamelCaseToWords from "../shared/hyphensAndCamelCaseToWords";
import shortText from "../shared/shortText";
import IconButton from "@material-ui/core/IconButton";
import CopyIcon from "@material-ui/icons/FileCopy";
import { useSnackbar } from "notistack";
import { getExplorerTxLink } from "../shared/types";
import useConnector from "../connect/useConnector";
import Link from "@material-ui/core/Link";
import LinkIcon from "@material-ui/icons/Launch";
import RefreshIcon from "@material-ui/icons/Refresh";
import { formatBigNumber, fromBigNumberToHms } from "../shared/formatters";
import { useEffect } from "react";
import { EExecutionState } from "@rsksmart/rif-scheduler-sdk";
import { useProvidersStore } from "../sdk-hooks/useProviders";
import { useState } from "react";
import { BIG_ZERO } from "../shared/reduceExecutionsLeft";
import { IExecutionSnapshot, useExecution } from "../sdk-hooks/useExecution";
import { ExecutionButton } from "./ExecutionButton";
import { getMessageFromCode } from "eth-rpc-errors";

const rowStyles = { display: "flex", alignItems: "center", gap: "5px" };

const ExecutionInfo: React.FC<{
  execution: IExecutionSnapshot;
}> = ({ execution }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [open, setOpen] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [refresh, cancel, refund, locateResult, contract, isConfirmed] =
    useExecution(execution.ref, execution.index);

  const providers = useProvidersStore((state) => state.providers);

  const provider = providers.find(
    (x) => x.config.contractAddress === execution.index.providerAddress
  );

  const { enqueueSnackbar } = useSnackbar();

  const connectedToNetwork = useConnector((state) => state.network);

  const scheduledTxExplorerAddressUrl =
    execution.index.scheduledTxHash &&
    connectedToNetwork &&
    getExplorerTxLink(execution.index.scheduledTxHash, connectedToNetwork);

  const completedTxExplorerAddressUrl =
    execution.index.completedTxHash &&
    connectedToNetwork &&
    getExplorerTxLink(execution.index.completedTxHash, connectedToNetwork);

  useEffect(() => {
    if (
      !execution.index.completedTxHash &&
      [
        EExecutionState.ExecutionFailed,
        EExecutionState.ExecutionSuccessful,
      ].includes(execution.state ?? EExecutionState.NotScheduled)
    ) {
      locateResult();
    }
  }, [execution.index.completedTxHash, execution.state, locateResult]);

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
    enqueueSnackbar("Copied!", { autoHideDuration: 500 });
  };

  const handleUpdateStatusClick = async () => {
    setIsLoading(true);

    try {
      await refresh();
    } catch (error) {
      const message = getMessageFromCode(error.code, error.message);

      enqueueSnackbar(message, {
        variant: "error",
      });
    }

    setIsLoading(false);
  };

  const handleCancelClick = async () => {
    setIsLoading(true);

    try {
      await cancel();
    } catch (error) {
      const message = getMessageFromCode(error.code, error.message);

      enqueueSnackbar(message, {
        variant: "error",
      });
    }

    setIsLoading(false);
  };

  const handleRefundClick = async () => {
    setIsLoading(true);

    try {
      await refund();
    } catch (error) {
      const message = getMessageFromCode(error.code, error.message);

      enqueueSnackbar(message, {
        variant: "error",
      });
    }

    setIsLoading(false);
  };

  if (!provider || !contract) return null;

  return (
    <>
      <ExecutionButton item={execution} onClick={() => setOpen(true)} />
      <Dialog
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth={true}
        open={open}
        onClose={() => setOpen(false)}
      >
        <DialogTitle>
          <div style={{ display: "flex", flex: 1 }}>
            <div style={{ display: "flex", flex: 1 }}>
              {execution.index.title}
            </div>
            <NetworkLabel />
          </div>
        </DialogTitle>
        <DialogContent>
          <TableContainer
            component={Paper}
            elevation={0}
            style={{ border: `1px solid ${theme.palette.action.hover}` }}
          >
            <Table aria-label="info table">
              <TableBody>
                <StyledTableRow>
                  <StrongTableCell component="th" scope="row">
                    #
                  </StrongTableCell>
                  <RegularTableCell align="right" style={rowStyles}>
                    <IconButton
                      aria-label="copy id"
                      size="small"
                      onClick={handleCopy(execution.id)}
                    >
                      <CopyIcon fontSize="inherit" />
                    </IconButton>
                    <span>{shortText(execution.id)}</span>
                  </RegularTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <StrongTableCell component="th" scope="row">
                    Scheduled tx
                  </StrongTableCell>
                  <RegularTableCell align="right" style={rowStyles}>
                    <IconButton
                      aria-label="copy transaction hash"
                      size="small"
                      onClick={handleCopy(execution.index.scheduledTxHash)}
                    >
                      <CopyIcon fontSize="inherit" />
                    </IconButton>
                    {scheduledTxExplorerAddressUrl && (
                      <Link
                        target="_blank"
                        href={scheduledTxExplorerAddressUrl ?? undefined}
                        rel="noreferrer"
                        style={rowStyles}
                      >
                        <LinkIcon style={{ fontSize: 16 }} />
                        {execution.index.scheduledTxHash &&
                          shortText(execution.index.scheduledTxHash)}
                      </Link>
                    )}
                    {!scheduledTxExplorerAddressUrl && (
                      <span>
                        {execution.index.scheduledTxHash &&
                          shortText(execution.index.scheduledTxHash)}
                      </span>
                    )}
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
                      disabled={
                        isLoading ||
                        !isConfirmed ||
                        ![
                          EExecutionState.NotScheduled,
                          EExecutionState.Scheduled,
                        ].includes(
                          execution.state ?? EExecutionState.NotScheduled
                        )
                      }
                    >
                      <RefreshIcon fontSize="inherit" />
                    </IconButton>
                    <StatusLabel
                      execution={execution}
                      isConfirmed={isConfirmed}
                      isLoading={isLoading}
                    />
                  </RegularTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <StrongTableCell component="th" scope="row">
                    Execute at
                  </StrongTableCell>
                  <RegularTableCell align="right">
                    {format(execution.executeAt, "MMMM do yyyy, hh:mm aaa")}
                  </RegularTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <StrongTableCell component="th" scope="row">
                    {`Provider #${provider?.index + 1}`}
                  </StrongTableCell>
                  <RegularTableCell align="right">
                    {contract.name}&nbsp;&#10140;&nbsp;
                    {hyphensAndCamelCaseToWords(execution.index.contractMethod)}
                  </RegularTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <StrongTableCell component="th" scope="row">
                    Plan #{+execution.index.providerPlanIndex + 1}
                  </StrongTableCell>
                  <RegularTableCell align="right">
                    {`Window: ${fromBigNumberToHms(
                      execution.ref.plan.window ?? BIG_ZERO
                    )} - Gas limit: ${formatBigNumber(
                      execution.ref.plan.gasLimit ?? BIG_ZERO,
                      0
                    )}`}
                  </RegularTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <StrongTableCell component="th" scope="row">
                    Executed tx
                  </StrongTableCell>
                  <RegularTableCell align="right" style={rowStyles}>
                    {execution.index.completedTxHash && (
                      <IconButton
                        aria-label="copy transaction hash"
                        size="small"
                        onClick={handleCopy(execution.index.completedTxHash)}
                      >
                        <CopyIcon fontSize="inherit" />
                      </IconButton>
                    )}
                    {completedTxExplorerAddressUrl && (
                      <Link
                        target="_blank"
                        href={completedTxExplorerAddressUrl ?? undefined}
                        rel="noreferrer"
                        style={rowStyles}
                      >
                        <LinkIcon style={{ fontSize: 16 }} />
                        {execution.index.completedTxHash &&
                          shortText(execution.index.completedTxHash)}
                      </Link>
                    )}
                    {!completedTxExplorerAddressUrl && (
                      <span>
                        {execution.index.completedTxHash
                          ? shortText(execution.index.completedTxHash)
                          : "---"}
                      </span>
                    )}
                  </RegularTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <StrongTableCell component="th" scope="row">
                    Result
                  </StrongTableCell>
                  <RegularTableCell align="right" style={rowStyles}>
                    {execution.index.result && (
                      <IconButton
                        aria-label="refresh result"
                        size="small"
                        onClick={
                          execution.index.result
                            ? handleCopy(execution.index.result)
                            : undefined
                        }
                        disabled={isLoading}
                      >
                        <CopyIcon fontSize="inherit" />
                      </IconButton>
                    )}
                    <span>
                      {execution.index.result
                        ? shortText(execution.index.result)
                        : "---"}
                    </span>
                  </RegularTableCell>
                </StyledTableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions
          style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 24 }}
        >
          <div style={{ display: "flex", flex: 1 }}>
            {execution.state === EExecutionState.Scheduled && (
              <Button
                onClick={handleCancelClick}
                disabled={isLoading || !isConfirmed}
                color="secondary"
                variant="contained"
              >
                Cancel
              </Button>
            )}
            {execution.state === EExecutionState.Overdue && (
              <Button
                onClick={handleRefundClick}
                disabled={isLoading || !isConfirmed}
                color="secondary"
                variant="contained"
              >
                Refund
              </Button>
            )}
          </div>
          <Button onClick={() => setOpen(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExecutionInfo;

const RegularTableCell = withStyles((theme: Theme) =>
  createStyles({
    head: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
    },
    body: {
      fontSize: 14,
      borderBottom: "none",
    },
  })
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
      maxWidth: 100,
    },
  })
)(TableCell);

const StyledTableRow = withStyles((theme: Theme) =>
  createStyles({
    root: {
      "&:nth-of-type(odd)": {
        backgroundColor: theme.palette.action.hover,
      },
    },
  })
)(TableRow);
