import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";

import React, { useEffect, useState } from "react";
import { formatBigNumber } from "../shared/formatters";
import Plan from "./Plan";

import Accordion from "@material-ui/core/Accordion";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { BIG_ZERO, executionsLeft } from "../shared/reduceExecutionsLeft";
import Chip from "@material-ui/core/Chip";
import { IProviderSnapshot } from "../sdk-hooks/useProviders";
import { usePlans } from "../sdk-hooks/usePlans";
import Loading from "./Loading";

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

const PlansList: React.FC<{
  expandedFixed: boolean;
  provider: IProviderSnapshot;
}> = ({ expandedFixed, provider }) => {
  const classes = useStyles();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [plans, loadPlans] = usePlans(provider);

  useEffect(() => {
    setIsLoading(true);
    loadPlans().then(() => setIsLoading(false));
  }, [loadPlans]);

  const [expanded, setExpanded] = useState<boolean>(expandedFixed);

  const handleExpandChange = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <>
      <Loading isLoading={isLoading} />
      <Accordion
        expanded={expandedFixed || expanded}
        onChange={handleExpandChange}
        elevation={0}
        className={classes.expanderRoot}
      >
        <AccordionSummary
          expandIcon={!expandedFixed ? <ExpandMoreIcon /> : undefined}
          aria-controls={`accordion-content-${provider.index}`}
          style={{ cursor: expandedFixed ? "default" : "pointer" }}
          id={`accordion-header-${provider.index}`}
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
                {`Provider #${provider.index + 1}`}
              </Typography>
              <Typography className={classes.expanderSecondaryHeading}>
                {`${formatBigNumber(
                  plans.reduce(executionsLeft, BIG_ZERO),
                  0
                )} executions left`}
              </Typography>
            </div>
            {!expandedFixed && (
              <Chip
                size="small"
                label={expanded ? "Show less" : "Show more"}
                style={{ cursor: "pointer" }}
              />
            )}
          </div>
        </AccordionSummary>
        <AccordionDetails style={{ padding: 0, flexDirection: "column" }}>
          <List className={classes.root}>
            {plans.map((plan, index) => (
              <Plan
                key={`plan-item-${plan.ref.config.contractAddress}-${index}`}
                value={plan}
              />
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default PlansList;
