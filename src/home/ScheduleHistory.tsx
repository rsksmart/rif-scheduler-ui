import {
  Avatar,
  Card,
  CardContent,
  Grid,
  Typography,
  makeStyles,
  colors,
  Link,
} from "@material-ui/core";
import ScheduleIcon from "@material-ui/icons/Timeline";
import useConnector from "../connect/useConnector";
import { Link as RouterLink } from "react-router-dom";
import { useIndexedExecutionsStore } from "../sdk-hooks/useExecutions";

const useStyles = makeStyles(() => ({
  root: {
    height: "100%",
  },
  avatar: {
    backgroundColor: colors.blueGrey[600],
    height: 56,
    width: 56,
  },
}));

const ScheduleHistory = ({ className, ...rest }: any) => {
  const classes = useStyles();

  const connectedToNetwork = useConnector((state) => state.network);

  const indexedExecutions = useIndexedExecutionsStore(
    (state) => state.indexedExecutions
  );

  const networkScheduledExecutions = Object.values(indexedExecutions).filter(
    (index) => index.network === connectedToNetwork && index.completedTxHash
  );

  return (
    <Card className={[classes.root, className].join(" ")} {...rest}>
      <CardContent>
        <Grid container justify="space-between" spacing={3}>
          <Grid item style={{ flex: 1 }}>
            <Typography color="textSecondary" gutterBottom variant="h6">
              EXECUTIONS COMPLETED
            </Typography>
            <Typography color="textPrimary" variant="h3">
              {networkScheduledExecutions.length}
            </Typography>
            <Link component={RouterLink} color="textSecondary" to="/schedule">
              Go to schedule &rsaquo;
            </Link>
          </Grid>
          <Grid item>
            <Avatar className={classes.avatar}>
              <ScheduleIcon />
            </Avatar>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ScheduleHistory;
