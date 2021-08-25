import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";

import React from "react";
import StatusLabel from "./StatusLabel";
import { Hidden } from "@material-ui/core";
import { formatBigNumber, fromBigNumberToHms } from "../shared/formatters";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import PurchaseIcon from "@material-ui/icons/AddCircle";

import { IPlanSnapshot } from "../sdk-hooks/usePlan";

const useStyles = makeStyles((theme: Theme) =>
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

const PlanButton: React.FC<{
  value: IPlanSnapshot;
  isConfirmed: boolean;
  disabled: boolean;
  onClick?: () => void;
}> = ({ value, disabled, isConfirmed, onClick }) => {
  const classes = useStyles();

  return (
    <ListItem
      disabled={disabled}
      button
      className={classes.row}
      onClick={onClick}
    >
      <div
        className={classes.part}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <ListItemText
          className={classes.part}
          primary={`#${value.index.add(1).toString()}`}
          secondary={`${
            value.remainingExecutions?.toString() ?? 0
          } executions left`}
        />
        <div style={{ paddingLeft: 16, paddingRight: 16 }}>
          <StatusLabel plan={value} isConfirmed={isConfirmed} />
        </div>
      </div>
      <Hidden xsDown>
        <Divider orientation="vertical" style={{ marginRight: 16 }} flexItem />
        <ListItemText
          primary={`Window: ${fromBigNumberToHms(value.window)}`}
          secondary={`Gas limit: ${formatBigNumber(value.gasLimit, 0)}`}
          className={classes.part}
        />
      </Hidden>
      <ListItemSecondaryAction>
        <PurchaseIcon style={{ color: "rgba(0, 0, 0, 0.12)" }} />
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default PlanButton;
