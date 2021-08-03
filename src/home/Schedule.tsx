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
import ScheduleIcon from "@material-ui/icons/EventAvailable";
import useConnector from "../connect/useConnector";
import { Link as RouterLink } from "react-router-dom";
import useSchedule from "../schedule/useSchedule";
import { EExecutionState } from "@rsksmart/rif-scheduler-sdk";

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

const Schedule = ({ className, ...rest }: any) => {
  const classes = useStyles();

  const connectedToNetwork = useConnector((state) => state.network);

  const scheduledExecutions = useSchedule((state) => state.scheduleItems);

  const networkScheduledExecutions = Object.entries(scheduledExecutions).filter(
    ([id, execution]) =>
      execution.network === connectedToNetwork &&
      execution.state === EExecutionState.Scheduled
  );

  return (
    <Card className={[classes.root, className].join(" ")} {...rest}>
      <CardContent>
        <Grid container justify="space-between" spacing={3}>
          <Grid item style={{ flex: 1 }}>
            <Typography color="textSecondary" gutterBottom variant="h6">
              SCHEDULED EXECUTIONS
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

export default Schedule;
