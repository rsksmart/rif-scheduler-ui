import { useEffect, useState } from "react";
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
import useProviders, { IPlanWithExecutions, IProvider } from "./useProviders";
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
import useConnector from "../connect/useConnector";

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
    plan: IPlanWithExecutions,
    executionsAmount: number
  ) => {
    // TODO: validate purchase fields
    const isValid = executionsAmount > 0 ? true : false;

    if (isValid) {
      purchaseExecutions(provider, index, executionsAmount);
    }
  };

  return (
    <>
      <ProviderButton
        name={provider.name}
        network={provider.network}
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
              Plans
            </Typography>
          </div>
          <LoadingCircle isLoading={isLoading} />
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            color="textSecondary"
            component="p"
            style={{ marginBottom: 16 }}
          >{`${provider.name} / ${provider.network}`}</Typography>

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
  plan: IPlanWithExecutions;
  onBuyClick?: (
    index: number,
    plan: IPlanWithExecutions,
    executionsAmount: number
  ) => void;
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
              {formatPrice(plan.pricePerExecution)}
            </Typography>
          </div>
        </div>
        <div className={classes.columnPurchase}>
          <Typography variant="caption" color="textSecondary">
            {`You have ${plan.remainingExecutions ?? 0} executions left`}
          </Typography>
          <br />
          <Typography
            id="executionsAmountSlider"
            variant="subtitle2"
            gutterBottom
          >
            Select the quantity of executions to purchase
          </Typography>
          <Slider
            disabled={isLoading}
            value={buyingExecutions}
            aria-labelledby="executionsAmountSlider"
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
          {`Total: ${buyingExecutions} x ${plan.pricePerExecution.toHexString()} (token) = ${plan.pricePerExecution
            .mul(buyingExecutions)
            .toHexString()} (token)`}
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
            disabled={isLoading}
            size="small"
            onClick={() => setBuyingExecutions(0)}
          >
            Clear
          </Button>
          <Button
            disabled={isLoading}
            size="small"
            color="primary"
            variant="outlined"
            onClick={handleBuy}
          >
            Buy
          </Button>
        </div>
      </AccordionActions>
    </Accordion>
  );
};

const ProviderButton = ({ name, network, onClick }: any) => {
  return (
    <Card>
      <CardActionArea
        style={{
          height: "100%",
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
          <Typography variant="body2" color="textSecondary" component="span">
            {network}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
