import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";

import React, { useCallback, useEffect, useState } from "react";
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
import useAdmin from "../shared/useAdmin";
import AddEditPlan from "./AddEditPlan";
import { Button } from "@material-ui/core";
import environment from "../shared/environment";
import { useSnackbar } from "notistack";
import { getMessageFromCode } from "eth-rpc-errors";

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
  const { enqueueSnackbar } = useSnackbar();

  const { isAdmin, isPaused, pauseUnpauseContract, refresh } =
    useAdmin(provider);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPausing, setIsPausing] = useState<boolean>(false);

  const [plans, loadPlans] = usePlans(provider);

  const handlePauseUnpause = async () => {
    setIsPausing(true);

    try {
      const tx = await pauseUnpauseContract();
      await tx.wait(environment.CONFIRMATIONS);
      await refresh();

      setIsPausing(false);
      enqueueSnackbar("Pause / Unpause confirmed!", {
        variant: "success",
      });
    } catch (error) {
      const message = getMessageFromCode(error.code, error.message);

      enqueueSnackbar(message, {
        variant: "error",
      });

      setIsPausing(false);
    }
  };

  const handlePlansLoad = useCallback(() => {
    setIsLoading(true);
    loadPlans().then(() => setIsLoading(false));
  }, [loadPlans]);

  useEffect(() => {
    handlePlansLoad();
  }, [handlePlansLoad]);

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
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <Typography className={classes.expanderHeading}>
                {`Provider #${provider.index + 1} ${
                  isPaused ? "(Paused)" : ""
                }`}
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
          <div style={{ display: "flex" }}>
            {isAdmin && (
              <div
                style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 16 }}
              >
                <AddEditPlan provider={provider} onClose={handlePlansLoad} />
              </div>
            )}
            {isAdmin && (
              <div
                style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 16 }}
              >
                <Button
                  aria-label="pause / unpause contract"
                  color="secondary"
                  variant="contained"
                  size="small"
                  disabled={isPausing}
                  onClick={handlePauseUnpause}
                >
                  {!isPausing && isPaused && "Unpause contract"}
                  {!isPausing && !isPaused && "Pause contract"}
                  {isPausing && "Waiting confirmation"}
                </Button>
              </div>
            )}
          </div>
          <List className={classes.root}>
            {plans.map((plan, index) => (
              <Plan
                key={`plan-item-${plan.ref.config.contractAddress}-${index}`}
                value={plan}
                provider={provider}
                isPaused={isPaused}
              />
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default PlansList;
