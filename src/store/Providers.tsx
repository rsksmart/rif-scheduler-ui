import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Card from "@material-ui/core/Card";
import Divider from "@material-ui/core/Divider";
import useProviders, { IPlan, IProvider } from "../store/useProviders";
import React, { useState } from "react";
import useConnector from "../connect/useConnector";
import StatusLabel from "./StatusLabel";
import { Hidden } from "@material-ui/core";
import { formatBigNumber, fromBigNumberToHms } from "../shared/formatters";
import PurchaseExecutions from "./PurchaseExecutions";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import PurchaseIcon from "@material-ui/icons/AddCircle";

import Accordion from "@material-ui/core/Accordion";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { executionsLeft, BIG_ZERO } from "../shared/reduceExecutionsLeft";
import Chip from "@material-ui/core/Chip";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
      padding: 5,
      gap: "5px",
      display: "flex",
      flexDirection: "column",
    },
    expanderHeading: {
      fontSize: theme.typography.pxToRem(15),
      display: "block",
    },
    expanderSecondaryHeading: {
      fontSize: theme.typography.pxToRem(15),
      color: theme.palette.text.secondary,
    },
    expanderRoot: {
      margin: 0,
      "&:before": {
        content: "none",
      },
    },
    divider: {
      width: "100%",
      maxWidth: 800,
    },
  })
);

const useRowStyles = makeStyles((theme: Theme) =>
  createStyles({
    part: {
      display: "flex",
      flexDirection: "column",
      flex: 1,
    },
    row: {
      borderLeft: `rgba(0, 0, 0, 0.12) 4px solid`,
      borderBottom: `rgba(0, 0, 0, 0.12) 1px solid`,
      borderRadius: 15,
    },
  })
);

const Item: React.FC<{
  item: IPlan;
  onClick?: (index: number) => void;
}> = ({ item, onClick }) => {
  const classes = useRowStyles();

  const handleItemClick = () => {
    if (onClick) onClick(item.index);
  };

  return (
    <ListItem button className={classes.row} onClick={handleItemClick}>
      <div
        className={classes.part}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <ListItemText
          className={classes.part}
          primary={`#${item.index + 1}`}
          secondary={`${
            item.remainingExecutions?.toString() ?? 0
          } executions left`}
        />
        <div style={{ paddingLeft: 16, paddingRight: 16 }}>
          <StatusLabel plan={item} />
        </div>
      </div>
      <Hidden xsDown>
        <Divider orientation="vertical" style={{ marginRight: 16 }} flexItem />
        <ListItemText
          primary={`Window: ${fromBigNumberToHms(item.window)}`}
          secondary={`Gas limit: ${formatBigNumber(item.gasLimit, 0)}`}
          className={classes.part}
        />
      </Hidden>
      <ListItemSecondaryAction>
        <PurchaseIcon style={{ color: "rgba(0, 0, 0, 0.12)" }} />
      </ListItemSecondaryAction>
    </ListItem>
  );
};

const Providers = () => {
  const classes = useStyles();

  const [expanded, setExpanded] = useState<string | false>(false);

  const handleExpandChange =
    (panel: string) => (event: React.ChangeEvent<{}>, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const [selectedPlan, setSelectedPlan] = useState<{
    provider: IProvider;
    planIndex: number;
  } | null>(null);

  const connectedToNetwork = useConnector((state) => state.network);

  const providers = useProviders((state) => state.providers);

  const networkProviders = Object.entries(providers).filter(
    ([id, provider]) => provider.network === connectedToNetwork
  );

  return (
    <>
      <PurchaseExecutions
        provider={selectedPlan?.provider}
        planIndex={selectedPlan?.planIndex}
        onClose={() => setSelectedPlan(null)}
      />
      <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        {networkProviders.map(([id, provider], index) => (
          <React.Fragment key={`provider-expander-${id}`}>
            <Accordion
              expanded={networkProviders.length === 1 || expanded === id}
              onChange={handleExpandChange(id)}
              elevation={0}
              className={classes.expanderRoot}
            >
              <AccordionSummary
                expandIcon={
                  networkProviders.length > 1 ? <ExpandMoreIcon /> : undefined
                }
                aria-controls={`accordion-content-${id}`}
                id={`accordion-header-${id}`}
              >
                <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    <Typography className={classes.expanderHeading}>
                      {provider.name}
                    </Typography>
                    <Typography className={classes.expanderSecondaryHeading}>
                      {`${formatBigNumber(
                        provider.plans.reduce(executionsLeft, BIG_ZERO),
                        0
                      )} executions left`}
                    </Typography>
                  </div>
                  {networkProviders.length > 1 && (
                    <Chip
                      size="small"
                      label={expanded === id ? "Show less" : "Show more"}
                      style={{ cursor: "pointer" }}
                    />
                  )}
                </div>
              </AccordionSummary>
              <AccordionDetails style={{ padding: 0 }}>
                <List className={classes.root}>
                  {provider.plans.map((item) => (
                    <Item
                      key={`plan-item-${item.index}`}
                      item={item}
                      onClick={(value) =>
                        setSelectedPlan({ provider, planIndex: value })
                      }
                    />
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
            {index !== networkProviders.length - 1 && (
              <Divider className={classes.divider} />
            )}
          </React.Fragment>
        ))}
      </Card>
    </>
  );
};

export default Providers;
