import Chip from "@material-ui/core/Chip";
import { ExecutionStateDescriptions } from "../shared/types";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { EExecutionState } from "@rsksmart/rif-scheduler-sdk";
import { IExecutionStatus } from "./useSchedule";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    [EExecutionState.NotScheduled]: {
      color: "#333",
      border: "1px solid #f7e463",
      backgroundColor: "#f7e463",
    },
    [EExecutionState.Scheduled]: {
      color: "#333",
      border: "1px solid #7cd992",
      backgroundColor: "#7cd992",
    },
    [EExecutionState.ExecutionSuccessful]: {
      color: "#333",
      border: "1px solid #7cd992",
      backgroundColor: "#7cd992",
    },
    [EExecutionState.ExecutionFailed]: {
      color: "#fff",
      border: "1px solid #eb6060",
      backgroundColor: "#eb6060",
    },
    [EExecutionState.Overdue]: {
      color: "#fff",
      border: "1px solid #eb6060",
      backgroundColor: "#eb6060",
    },
    [EExecutionState.Cancelled]: {
      color: "#333",
      border: "1px solid #a8a8a8",
      backgroundColor: "#a8a8a8",
    },
    [EExecutionState.Refunded]: {
      color: "#333",
      border: "1px solid #a8a8a8",
      backgroundColor: "#a8a8a8",
    },
  })
);

const StatusLabel = ({
  execution,
  isLoading,
}: {
  execution: IExecutionStatus;
  isLoading?: boolean;
}) => {
  const classes = useStyles();

  const state = execution.state ?? EExecutionState.NotScheduled;
  const isConfirmed = execution.isConfirmed;

  const label = isLoading
    ? "..."
    : isConfirmed
    ? ExecutionStateDescriptions[state]
    : "Waiting confirmation";

  return (
    <Chip
      size="small"
      color="primary"
      variant="default"
      label={label}
      classes={{
        colorPrimary:
          classes[isConfirmed ? state : EExecutionState.NotScheduled],
      }}
    />
  );
};

export default StatusLabel;
