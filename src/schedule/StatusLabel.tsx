import Chip from '@material-ui/core/Chip';
import { ExecutionStateDescriptions } from "../shared/types";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { ExecutionState } from '@rsksmart/rif-scheduler-sdk';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    [ExecutionState.Nonexistent]: {
      color: "#333",
      border: "1px solid #f7e463",
      backgroundColor: "#f7e463"
    },
    [ExecutionState.Scheduled]: {
        color: "#333",
        border: "1px solid #7cd992",
        backgroundColor: "#7cd992"
    },
    [ExecutionState.ExecutionSuccessful]: {
        color: "#333",
        border: "1px solid #7cd992",
        backgroundColor: "#7cd992"
    },
    [ExecutionState.ExecutionFailed]: {
        color: "#fff",
        border: "1px solid #eb6060",
        backgroundColor: "#eb6060"
    },
    [ExecutionState.Overdue]: {
        color: "#fff",
        border: "1px solid #eb6060",
        backgroundColor: "#eb6060"
    },
    [ExecutionState.Cancelled]: {
        color: "#333",
        border: "1px solid #a8a8a8",
        backgroundColor: "#a8a8a8"
    },
    [ExecutionState.Refunded]: {
        color: "#333",
        border: "1px solid #a8a8a8",
        backgroundColor: "#a8a8a8"
    },
  })
);

const StatusLabel = ({ state = ExecutionState.Nonexistent, isLoading }: { state?: ExecutionState, isLoading?: boolean }) => {
    const classes = useStyles();

    const label = isLoading ? "..." : ExecutionStateDescriptions[state]

    return <Chip size="small" color="primary" variant="default" label={label} classes={{
        colorPrimary: classes[state]
    }} />
}

export default StatusLabel