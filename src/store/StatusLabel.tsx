import Chip from '@material-ui/core/Chip';
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { IPlan } from './useProviders';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    purchasing: {
      color: "#333",
      border: "1px solid #f7e463",
      backgroundColor: "#f7e463"
    },
    active: {
        color: "#333",
        border: "1px solid #7cd992",
        backgroundColor: "#7cd992"
    },
    inactive: {
        color: "#333",
        border: "1px solid #a8a8a8",
        backgroundColor: "#a8a8a8"
    },
  })
);

const StatusLabel = ({ plan }: { plan: IPlan }) => {
    const classes = useStyles();

    let label = plan.active ? "Active" : "Inactive"
    let classStatus = plan.active ? classes.active : classes.inactive

    if (!plan.isPurchaseConfirmed) {
        label = "Waiting confirmation"
        classStatus = classes.purchasing
    }

    return <Chip size="small" color="primary" variant="default" label={label} classes={{
        colorPrimary: classStatus
    }} />
}

export default StatusLabel