import {
  Avatar,
  Box,
  Grid,
  LinearProgress,
  Typography,
  makeStyles,
  colors,
  Button,
} from "@material-ui/core";
import HelpIcon from "@material-ui/icons/Help";
import ReadyIcon from "@material-ui/icons/CheckCircle";
import useConnector from "../connect/useConnector";
import { Link as RouterLink } from "react-router-dom";
import useContracts from "../contracts/useContracts";
import { BIG_ZERO } from "../shared/reduceExecutionsLeft";
import { useProvidersStore } from "../sdk-hooks/useProviders";
import { getExecutionsLeftTotal } from "../sdk-hooks/getExecutionsLeftTotal";
import { useEffect, useState } from "react";

const useStyles = makeStyles(() => ({
  root: {
    height: "100%",
  },
  avatar: {
    backgroundColor: colors.orange[800],
    height: 56,
    width: 56,
  },
  avatarReady: {
    backgroundColor: colors.green[800],
    height: 56,
    width: 56,
  },
}));

enum ETask {
  PurchaseExecutions = 0,
  RegisterContracts = 1,
  ReadyToSchedule = 2,
}

const TASKS = [
  {
    title: "You need to purchase executions",
    link: "/store",
    linkLabel: "Purchase executions",
  },
  {
    title: "You need to register some contracts",
    link: "/contracts",
    linkLabel: "Register contracts",
  },
  {
    title: "You are ready to schedule executions",
    link: "/schedule",
    linkLabel: "Schedule an execution",
  },
];

const TasksProgress = ({ className, ...rest }: any) => {
  const classes = useStyles();

  const totalTasks = TASKS.length - 1;

  const connectedToNetwork = useConnector((state) => state.network);

  const [executionsLeft, setExecutionsLeft] = useState(BIG_ZERO);
  const providers = useProvidersStore((state) => state.providers);

  useEffect(() => {
    getExecutionsLeftTotal(providers).then((total) => setExecutionsLeft(total));
  }, [providers]);

  const contracts = useContracts((state) => state.contracts);
  const networkContracts = Object.entries(contracts).filter(
    ([id, contract]) => contract.network === connectedToNetwork
  );

  let currentTask = ETask.ReadyToSchedule;
  if (executionsLeft.lte(BIG_ZERO)) {
    currentTask = ETask.PurchaseExecutions;
  } else if (networkContracts.length <= 0) {
    currentTask = ETask.RegisterContracts;
  }

  return (
    <>
      <Grid container justify="space-between" spacing={3}>
        <Grid item style={{ flex: 1 }}>
          <Typography
            color="textPrimary"
            variant="body1"
            style={{ marginBottom: "0.35em" }}
          >
            {TASKS[currentTask].title}
          </Typography>
          <Button
            component={RouterLink}
            to={TASKS[currentTask].link}
            variant="contained"
            color="primary"
          >
            {TASKS[currentTask].linkLabel}
          </Button>
        </Grid>
        <Grid item>
          {currentTask !== totalTasks && (
            <Avatar className={classes.avatar}>
              <HelpIcon />
            </Avatar>
          )}
          {currentTask === totalTasks && (
            <Avatar className={classes.avatarReady}>
              <ReadyIcon />
            </Avatar>
          )}
        </Grid>
      </Grid>
      <Box mt={3}>
        <LinearProgress
          value={(currentTask * 100) / totalTasks}
          variant="determinate"
        />
      </Box>
    </>
  );
};

export default TasksProgress;
