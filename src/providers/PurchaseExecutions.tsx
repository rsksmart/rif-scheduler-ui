import { useState } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import {
  useTheme,
  Theme,
  createStyles,
  makeStyles,
} from "@material-ui/core/styles";
import PriceIcon from "@material-ui/icons/AccountBalanceWallet";
import useProviders, { IPlan, IProvider } from "./useProviders";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import { CardActionArea } from "@material-ui/core";
import providerSvg from "../assets/illustrations/providerSchedule.svg";
import Accordion from "@material-ui/core/Accordion";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionActions from "@material-ui/core/AccordionActions";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Divider from "@material-ui/core/Divider";
import Slider from "@material-ui/core/Slider";
import { fromBigNumberToHms, formatPrice } from "../shared/formatters";
import shallow from "zustand/shallow";
import LoadingCircle from "../shared/LoadingCircle";
import useRifScheduler from "./useRifScheduler";
import { useSnackbar } from "notistack";
import StatusLabel from "./StatusLabel";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    heading: {
      fontSize: theme.typography.pxToRem(15),
    },
    secondaryHeading: {
      fontSize: theme.typography.pxToRem(15),
      color: theme.palette.text.secondary,
    },
    icon: {
      verticalAlign: "bottom",
      height: 20,
      width: 20,
    },
    details: {
      alignItems: "center",
    },
    column: {
      flexBasis: "33.33%",
    },
    columnWindow: {
      marginLeft: 12,
      flex: 1,
    },
    columnPurchase: {
      borderLeft: `2px solid ${theme.palette.divider}`,
      padding: theme.spacing(1, 2),
      flex: 1,
    },
    link: {
      color: theme.palette.primary.main,
      textDecoration: "none",
      "&:hover": {
        textDecoration: "underline",
      },
    },
  })
);

const PurchaseExecutions = ({ provider }: { provider: IProvider }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const { enqueueSnackbar } = useSnackbar();

  const rifScheduler = useRifScheduler();

  const [purchaseExecutions, isLoading] = useProviders(
    (state) => [state.purchaseExecutions, state.isLoading],
    shallow
  );

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleBuyClick = (
    index: number,
    plan: IPlan,
    executionsQuantity: number
  ) => {
    // TODO: validate purchase fields
    const isValid = executionsQuantity > 0 ? true : false;

    if (isValid && rifScheduler) {
      purchaseExecutions(
        provider.id, 
        index, 
        executionsQuantity, 
        rifScheduler,
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
  };

  return (
    <>
      <ProviderButton
        name={provider.name}
        plans={provider.plans}
        onClick={handleClickOpen}
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
          <div>
            <Typography component={"h2"} variant="h6">
              {`${provider.name}'s plans`}
            </Typography>
          </div>
          <LoadingCircle isLoading={isLoading} />
        </DialogTitle>
        <DialogContent>
          {provider.plans.map((plan, index) => (
            <PlanRow
              key={`plan-row-${provider.id}-${index}`}
              index={index}
              plan={plan}
              onBuyClick={handleBuyClick}
              isLoading={isLoading}
            />
          ))}
        </DialogContent>
        <DialogActions
          style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 24 }}
        >
          <Button onClick={handleClose} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PurchaseExecutions;

const PlanRow: React.FC<{
  index: number;
  plan: IPlan;
  onBuyClick?: (index: number, plan: IPlan, executionsQuantity: number) => void;
  isLoading: boolean;
}> = ({ index, plan, onBuyClick, isLoading }) => {
  const classes = useStyles();

  const [buyingExecutions, setBuyingExecutions] = useState(0);

  const handleBuy = () => {
    if (onBuyClick) onBuyClick(index, plan, buyingExecutions);

    setBuyingExecutions(0);
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <div>
          <Typography className={classes.heading}>{`#${index + 1}`}</Typography>
        </div>
        <div style={{marginLeft: 12}}>
          <StatusLabel plan={plan} />
        </div>
        <div className={classes.columnWindow}>
          <Typography className={classes.secondaryHeading}>
            {`Window: ${fromBigNumberToHms(plan.window)}`}
          </Typography>
        </div>
      </AccordionSummary>
      <AccordionDetails className={classes.details}>
        <div className={classes.column}>
          <Typography variant="caption" color="textSecondary">
            Price Per Execution
          </Typography>
          <br />
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <PriceIcon />
            <Typography variant="h5">
              {formatPrice(plan.pricePerExecution, plan.decimals)}
            </Typography>
          </div>
        </div>
        <div className={classes.columnPurchase}>
          <Typography variant="caption" color="textSecondary">
            {`You have ${plan.remainingExecutions ?? 0} executions left`}
          </Typography>
          <br />
          <Typography
            id="executionsQuantitySlider"
            variant="subtitle2"
            gutterBottom
          >
            Select the quantity of executions to purchase
          </Typography>
          <Slider
            disabled={isLoading || !plan.isPurchaseConfirmed || !plan.active}
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
        </div>
      </AccordionDetails>
      <Divider />
      <AccordionActions
        style={{ justifyContent: "space-between", flexWrap: "wrap" }}
      >
        <Typography variant="caption">
          {`Total: ${buyingExecutions} x ${formatPrice(
            plan.pricePerExecution,
            plan.decimals
          )} ${plan.symbol} = ${formatPrice(
            plan.pricePerExecution.mul(buyingExecutions),
            plan.decimals
          )} ${plan.symbol}`}
        </Typography>
        <div
          style={{
            display: "flex",
            flex: 1,
            justifyContent: "flex-end",
            gap: "4px",
          }}
        >
          <Button
            disabled={isLoading || !plan.isPurchaseConfirmed || !plan.active}
            size="small"
            onClick={() => setBuyingExecutions(0)}
          >
            Clear
          </Button>
          <Button
            disabled={isLoading || !plan.isPurchaseConfirmed || !plan.active}
            size="small"
            color="primary"
            variant="outlined"
            onClick={handleBuy}
          >
            {plan.isPurchaseConfirmed ? "Buy" : "Waiting confirmation"}
          </Button>
        </div>
      </AccordionActions>
    </Accordion>
  );
};

const ProviderButton = ({ name, plans, onClick }: { name: string, plans: IPlan[], onClick: any }) => {
  const plansWithRemainingExecutions = plans.filter(x=> x.remainingExecutions && x.remainingExecutions.gt(0))

  return (
    <Card>
      <CardActionArea
        style={{
          height: "100%",
          width: "100%",
          background: `url(${providerSvg}) no-repeat`,
          backgroundPosition: "right -60px top -20px",
          backgroundSize: "160px 160px",
        }}
        onClick={onClick}
      >
        <CardContent>
          <Typography gutterBottom variant="h5" component="h2">
            {name}
          </Typography>
          {plansWithRemainingExecutions.map((plan, index) => (
            <Typography key={`plan-remaining-${plan.window.toString()}`} variant="body2" color="textSecondary" component="div">
              {`Window ${fromBigNumberToHms(plan.window)}: ${plan.remainingExecutions} executions left`}
            </Typography>
          ))}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
