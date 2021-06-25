import Chip from '@material-ui/core/Chip';
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { IPlan } from './useProviders';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    purchasing: {
      color: "#f7e463",
      border: "1px solid #f7e463"
    },
    active: {
        color: "#7cd992",
        border: "1px solid #7cd992"
    },
    inactive: {
        color: "#a8a8a8",
        border: "1px solid #a8a8a8"
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

    return <Chip size="small" color="primary" variant="outlined" label={label} classes={{
        outlinedPrimary: classStatus
    }} />
}

export default StatusLabel