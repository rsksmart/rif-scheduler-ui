import { useState } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import {
  withStyles,
  useTheme,
  Theme,
  createStyles,
} from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { fromBigNumberToHms, formatBigNumber } from "../shared/formatters";
import LoadingCircle from "../shared/LoadingCircle";
import StatusLabel from "./StatusLabel";
import NetworkLabel from "../connect/NetworkLabel";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import { IPlanSnapshot, usePlan } from "../sdk-hooks/usePlan";
import PlanButton from "./PlanButton";
import { IconButton, InputAdornment, TextField } from "@material-ui/core";
import NumberInput from "../shared/NumberInput";
import PlusIcon from "@material-ui/icons/AddCircleRounded";
import MinusIcon from "@material-ui/icons/RemoveCircleRounded";
import { TokenType } from "@rsksmart/rif-scheduler-sdk/dist/token";
import { useSnackbar } from "notistack";
import { getMessageFromCode } from "eth-rpc-errors";
import useAdmin from "../shared/useAdmin";
import { IProviderSnapshot } from "../sdk-hooks/useProviders";
import environment from "../shared/environment";

const rowStyles = { display: "flex", alignItems: "center", gap: "5px" };

export enum EApprovalStatus {
  verify,
  verified,
  approved,
}

const Plan: React.FC<{
  value: IPlanSnapshot;
  provider: IProviderSnapshot;
  isPaused: boolean;
}> = ({ value, provider, isPaused }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const { enqueueSnackbar } = useSnackbar();

  const { isAdmin, cancelPlan } = useAdmin(provider);

  const [open, setOpen] = useState<boolean>(false);

  const [verifyApproval, approve, purchase, refresh, isConfirmed] = usePlan(
    value.ref
  );

  const [buyingExecutions, setBuyingExecutions] = useState<number>(0);
  const [isNormalLoading, setIsLoading] = useState<boolean>(false);
  const [isCanceling, setIsCanceling] = useState<boolean>(false);
  const [approvalStatus, setApprovalStatus] = useState<EApprovalStatus>(
    value.tokenType === TokenType.ERC20
      ? EApprovalStatus.verify
      : EApprovalStatus.approved
  );

  const handleClose = () => {
    setOpen(false);
  };

  const handleCancelPlan = async () => {
    setIsCanceling(true);

    try {
      const tx = await cancelPlan(value.index);

      await tx.wait(environment.CONFIRMATIONS);

      await refresh();

      setIsCanceling(false);
      enqueueSnackbar("Plan cancel confirmed!", {
        variant: "success",
      });
    } catch (error) {
      const message = getMessageFromCode(error.code, error.message);

      enqueueSnackbar(message, {
        variant: "error",
      });

      setIsCanceling(false);
    }
  };

  const handleBuyingExecutionsIncrement = (increment: number) => () => {
    setBuyingExecutions((prevQuantity) => {
      let quantity = +prevQuantity + increment;

      if (quantity <= 0) quantity = 0;

      return quantity;
    });

    setApprovalStatus(
      value.tokenType === TokenType.ERC20
        ? EApprovalStatus.verify
        : EApprovalStatus.approved
    );
  };

  const handleBuyingExecutionsChange = (quantity: number) => {
    if (quantity <= 0) quantity = 0;

    setBuyingExecutions(quantity);
    setApprovalStatus(
      value.tokenType === TokenType.ERC20
        ? EApprovalStatus.verify
        : EApprovalStatus.approved
    );
  };

  const handleBuyClick = async (executionsQuantity: number) => {
    const isValid = executionsQuantity > 0 ? true : false;

    if (isValid) {
      setIsLoading(true);

      try {
        if (approvalStatus === EApprovalStatus.verify) {
          const approvalResult = await verifyApproval(executionsQuantity);
          setApprovalStatus(
            approvalResult ? EApprovalStatus.verified : EApprovalStatus.approved
          );
        }

        if (approvalStatus === EApprovalStatus.verified) {
          await approve(executionsQuantity);
          setApprovalStatus(EApprovalStatus.verify);
        }

        if (approvalStatus === EApprovalStatus.approved) {
          await purchase(executionsQuantity);
          setBuyingExecutions(0);

          setApprovalStatus(
            value.tokenType === TokenType.ERC20
              ? EApprovalStatus.verify
              : EApprovalStatus.approved
          );
        }
      } catch (error) {
        const message = getMessageFromCode(error.code, error.message);

        enqueueSnackbar(message, {
          variant: "error",
        });
      }

      setIsLoading(false);
    }
  };

  const isLoading = isNormalLoading || isCanceling;

  return (
    <>
      <PlanButton
        value={value}
        disabled={isPaused}
        isConfirmed={isConfirmed}
        onClick={() => setOpen(true)}
      />
      <Dialog
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth={true}
        open={open}
        onClose={handleClose}
      >
        <DialogTitle
          style={{ display: "flex", justifyContent: "space-between" }}
          disableTypography
        >
          <div style={{ display: "flex", flex: 1 }}>
            <div style={{ display: "flex", flex: 1 }}>
              <Typography component={"h2"} variant="h6">
                {`Plan #${value.index.add(1).toString()}`}
              </Typography>
            </div>
            <LoadingCircle isLoading={isLoading} />
            <NetworkLabel />
          </div>
        </DialogTitle>
        <DialogContent>
          {isCanceling && (
            <>
              <Typography variant="subtitle1" color="error" component="p">
                Waiting for transaction confirmation:
              </Typography>
              <Typography variant="subtitle1" color="error" component="p">
                Please do NOT close this window.
              </Typography>
            </>
          )}
          <TableContainer
            component={Paper}
            elevation={0}
            style={{ border: `1px solid ${theme.palette.action.hover}` }}
          >
            <Table aria-label="info table">
              <TableBody>
                <StyledTableRow>
                  <StrongTableCell component="th" scope="row">
                    Remaining executions
                  </StrongTableCell>
                  <RegularTableCell align="right">
                    <Typography variant="h5">
                      {value.remainingExecutions.toString()}
                    </Typography>
                  </RegularTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <StrongTableCell component="th" scope="row">
                    Status
                  </StrongTableCell>
                  <RegularTableCell align="right" style={rowStyles}>
                    <StatusLabel plan={value} isConfirmed={isConfirmed} />
                  </RegularTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <StrongTableCell component="th" scope="row">
                    Window
                  </StrongTableCell>
                  <RegularTableCell align="right">
                    {fromBigNumberToHms(value.window)}
                  </RegularTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <StrongTableCell component="th" scope="row">
                    Gas limit
                  </StrongTableCell>
                  <RegularTableCell align="right">
                    {formatBigNumber(value.gasLimit, 0)}
                  </RegularTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <StrongTableCell component="th" scope="row">
                    Price per execution
                  </StrongTableCell>
                  <RegularTableCell align="right">
                    {`${formatBigNumber(
                      value.pricePerExecution,
                      value.tokenDecimals
                    )} ${value.tokenSymbol}`}
                  </RegularTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <StrongTableCell component="th" scope="row">
                    Quantity to purchase
                  </StrongTableCell>
                  <RegularTableCell align="right" style={{ width: 200 }}>
                    <TextField
                      disabled={isLoading || !isConfirmed}
                      margin="dense"
                      hiddenLabel
                      variant="filled"
                      fullWidth
                      style={{ flex: 1, minWidth: 120 }}
                      onChange={(event) =>
                        handleBuyingExecutionsChange(+event.target.value)
                      }
                      value={buyingExecutions}
                      InputProps={{
                        inputComponent: NumberInput as any,
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconButton
                              size="small"
                              aria-label="sub 10 quantity"
                              onClick={handleBuyingExecutionsIncrement(-10)}
                              edge="start"
                              disabled={isLoading || !isConfirmed}
                            >
                              <MinusIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              aria-label="add 10 quantity"
                              onClick={handleBuyingExecutionsIncrement(10)}
                              edge="end"
                              disabled={isLoading || !isConfirmed}
                            >
                              <PlusIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </RegularTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <StrongTableCell component="th" scope="row">
                    Total
                  </StrongTableCell>
                  <BigTableCell align="right">
                    {`${formatBigNumber(
                      value.pricePerExecution.mul(buyingExecutions),
                      value.tokenDecimals
                    )}`}

                    {` ${value.tokenSymbol}`}
                  </BigTableCell>
                </StyledTableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions
          style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 24 }}
        >
          {isAdmin && (
            <div style={{ display: "flex", flex: 1 }}>
              <Button
                onClick={handleCancelPlan}
                disabled={isLoading || !value.isActive}
                color="secondary"
              >
                Deactivate plan
              </Button>
            </div>
          )}
          <Button
            color="inherit"
            disabled={isLoading}
            onClick={() => {
              setBuyingExecutions(0);
              setOpen(false);
            }}
          >
            Close
          </Button>
          <Button
            disabled={
              isLoading ||
              !isConfirmed ||
              !value.isActive ||
              +buyingExecutions === 0
            }
            color="primary"
            variant="contained"
            style={{ minWidth: 160 }}
            onClick={() => handleBuyClick(buyingExecutions)}
          >
            {isConfirmed &&
              approvalStatus === EApprovalStatus.verify &&
              "Verify approval"}
            {isConfirmed &&
              approvalStatus === EApprovalStatus.verified &&
              "Approve"}
            {isConfirmed &&
              approvalStatus === EApprovalStatus.approved &&
              "Buy"}
            {!isConfirmed && "Waiting confirmation"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Plan;

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

const BigTableCell = withStyles((theme: Theme) =>
  createStyles({
    head: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
    },
    body: {
      fontSize: "1rem",
      fontWeight: "bold",
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
      maxWidth: 60,
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
