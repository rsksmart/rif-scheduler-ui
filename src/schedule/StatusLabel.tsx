import Chip from '@material-ui/core/Chip';
import { ExecutionState, ExecutionStateDescriptions } from "../shared/types";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    [ExecutionState.NotScheduled]: {
      color: "#f7e463",
      border: "1px solid #f7e463"
    },
    [ExecutionState.Scheduled]: {
        color: "#7cd992",
        border: "1px solid #7cd992"
    },
    [ExecutionState.ExecutionSuccessful]: {
        color: "#7cd992",
        border: "1px solid #7cd992"
    },
    [ExecutionState.ExecutionFailed]: {
        color: "#eb6060",
        border: "1px solid #eb6060"
    },
    [ExecutionState.Overdue]: {
        color: "#eb6060",
        border: "1px solid #eb6060"
    },
    [ExecutionState.Cancelled]: {
        color: "#a8a8a8",
        border: "1px solid #a8a8a8"
    },
    [ExecutionState.Refunded]: {
        color: "#a8a8a8",
        border: "1px solid #a8a8a8"
    },
  })
);

const StatusLabel = ({ state = ExecutionState.NotScheduled, isLoading }: { state?: ExecutionState, isLoading?: boolean }) => {
    const classes = useStyles();

    const label = isLoading ? "..." : ExecutionStateDescriptions[state]

    return <Chip size="small" color="primary" variant="outlined" label={label} classes={{
        outlinedPrimary: classes[state]
    }} />
}

export default StatusLabel