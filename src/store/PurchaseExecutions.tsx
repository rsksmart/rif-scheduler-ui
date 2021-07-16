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
import useProviders, { IProvider } from "./useProviders";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import { fromBigNumberToHms, formatBigNumber } from "../shared/formatters";
import shallow from "zustand/shallow";
import LoadingCircle from "../shared/LoadingCircle";
import { useSnackbar } from "notistack";
import StatusLabel from "./StatusLabel";
import NetworkLabel from "../connect/NetworkLabel";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";

const rowStyles = { display: "flex", alignItems: "center", gap: "5px" };

interface IPurchaseExecutionsProps {
  provider: IProvider | null | undefined;
  planIndex: number | null | undefined;
  onClose: () => void;
}

const PurchaseExecutions = ({
  provider,
  planIndex,
  onClose,
}: IPurchaseExecutionsProps) => {
  const open = provider && (planIndex ?? -1) >= 0 ? true : false;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const { enqueueSnackbar } = useSnackbar();

  const [purchaseExecutions, isLoading] = useProviders(
    (state) => [state.purchaseExecutions, state.isLoading],
    shallow
  );

  const [buyingExecutions, setBuyingExecutions] = useState(0);

  if (!provider || (planIndex ?? -1) < 0) return null;

  const handleBuyClick = (planIndex: number, executionsQuantity: number) => {
    // TODO: validate purchase fields
    const isValid = executionsQuantity > 0 ? true : false;

    if (isValid) {
      purchaseExecutions(
        provider.id,
        planIndex,
        executionsQuantity,
        () =>
          enqueueSnackbar("Purchase confirmed!", {
            variant: "success",
          }),
        (message) =>
          enqueueSnackbar(message, {
            variant: "error",
          })
      );
    }

    setBuyingExecutions(0);
  };

  const plan = provider.plans[planIndex!];

  return (
    <Dialog
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth={true}
      open={open}
      onClose={onClose}
    >
      <DialogTitle
        style={{ display: "flex", justifyContent: "space-between" }}
        disableTypography
      >
        <div style={{ display: "flex", flex: 1 }}>
          <div style={{ display: "flex", flex: 1 }}>
            <Typography component={"h2"} variant="h6">
              {`Plan #${planIndex! + 1}`}
            </Typography>
          </div>
          <LoadingCircle isLoading={isLoading} />
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
                  Remaining executions
                </StrongTableCell>
                <RegularTableCell align="right">
                  <Typography variant="h5">
                    {plan.remainingExecutions?.toString()}
                  </Typography>
                </RegularTableCell>
              </StyledTableRow>
              <StyledTableRow>
                <StrongTableCell component="th" scope="row">
                  Status
                </StrongTableCell>
                <RegularTableCell align="right" style={rowStyles}>
                  <StatusLabel plan={plan} />
                </RegularTableCell>
              </StyledTableRow>
              <StyledTableRow>
                <StrongTableCell component="th" scope="row">
                  Window
                </StrongTableCell>
                <RegularTableCell align="right">
                  {fromBigNumberToHms(plan.window)}
                </RegularTableCell>
              </StyledTableRow>
              <StyledTableRow>
                <StrongTableCell component="th" scope="row">
                  Gas limit
                </StrongTableCell>
                <RegularTableCell align="right">
                  {formatBigNumber(plan.gasLimit, 0)}
                </RegularTableCell>
              </StyledTableRow>
              <StyledTableRow>
                <StrongTableCell component="th" scope="row">
                  Price per execution
                </StrongTableCell>
                <RegularTableCell align="right">
                  {`${formatBigNumber(plan.pricePerExecution, plan.decimals)} ${
                    plan.symbol
                  }`}
                </RegularTableCell>
              </StyledTableRow>
              <StyledTableRow>
                <StrongTableCell component="th" scope="row">
                  Quantity to purchase
                </StrongTableCell>
                <RegularTableCell
                  align="right"
                  style={{ width: 200, paddingRight: 23 }}
                >
                  <Slider
                    disabled={
                      isLoading || !plan.isPurchaseConfirmed || !plan.active
                    }
                    value={buyingExecutions}
                    aria-labelledby="executionsQuantitySlider"
                    step={10}
                    valueLabelDisplay="auto"
                    onChange={(event, value: number | number[]) => {
                      setBuyingExecutions(value as number);
                    }}
                    marks={[
                      {
                        value: 0,
                        label: "0",
                      },
                      {
                        value: 20,
                        label: "20",
                      },
                      {
                        value: 50,
                        label: "50",
                      },
                      {
                        value: 100,
                        label: "100",
                      },
                    ]}
                  />
                </RegularTableCell>
              </StyledTableRow>
              <StyledTableRow>
                <StrongTableCell component="th" scope="row">
                  Total
                </StrongTableCell>
                <BigTableCell align="right">
                  {`${formatBigNumber(
                    plan.pricePerExecution.mul(buyingExecutions),
                    plan.decimals
                  )}`}

                  {` ${plan.symbol}`}
                </BigTableCell>
              </StyledTableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions
        style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 24 }}
      >
        <Button
          color="inherit"
          disabled={isLoading}
          onClick={() => {
            setBuyingExecutions(0);
            onClose();
          }}
        >
          Close
        </Button>
        <Button
          disabled={
            isLoading ||
            !plan.isPurchaseConfirmed ||
            !plan.active ||
            buyingExecutions === 0
          }
          color="primary"
          variant="contained"
          onClick={() => handleBuyClick(planIndex!, buyingExecutions)}
        >
          {plan.isPurchaseConfirmed ? "Buy" : "Waiting confirmation"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseExecutions;

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
