
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Typography,
  makeStyles,
  colors,
  Link
} from '@material-ui/core';
import HelpIcon from '@material-ui/icons/Help';
import ReadyIcon from '@material-ui/icons/CheckCircle';
import { BigNumber } from 'ethers';
import useConnector from '../connect/useConnector';
import useProviders from '../store/useProviders';
import { Link as RouterLink } from "react-router-dom"
import useContracts from '../contracts/useContracts';

const useStyles = makeStyles(() => ({
  root: {
    height: '100%',
  },
  avatar: {
    backgroundColor: colors.orange[800],
    height: 56,
    width: 56
  },
  avatarReady: {
    backgroundColor: colors.green[800],
    height: 56,
    width: 56
  }
}));

enum ETask {
  PurchaseExecutions = 0,
  RegisterContracts = 1,
  ReadyToSchedule = 2
}

const TASKS = [
{
  title: "You need to purchase executions",
  link: "/store",
  linkLabel: "Go to store"
},
{
  title: "You need to register some contracts",
  link: "/contracts",
  linkLabel: "Go to contracts"
},
{
  title: "You are ready to schedule executions",
  link: "/schedule",
  linkLabel: "Go to schedule"
}
]

const BIG_ZERO = BigNumber.from(0)

const TasksProgress = ({ className, ...rest }: any) => {
  const classes = useStyles();

  const totalTasks = TASKS.length - 1

  const connectedToNetwork = useConnector(state => state.network)

  const providers = useProviders((state) => state.providers)

  const networkProviders = Object.entries(providers)
    .filter(([id, provider])=> provider.network === connectedToNetwork)

  const executionsLeft = networkProviders.reduce((accumulated, [id, provider])=>{

    const providerExecutionsLeft = provider.plans
      .reduce((accumulatedPlans, currentPlan) => accumulatedPlans.add(currentPlan.remainingExecutions ?? BIG_ZERO), BIG_ZERO)

    return accumulated.add(providerExecutionsLeft)

  }, BIG_ZERO)

  const contracts = useContracts((state) => state.contracts);
  const networkContracts = Object.entries(contracts)
    .filter(([id, contract])=> contract.network === connectedToNetwork)

  let currentTask = ETask.ReadyToSchedule
  if (executionsLeft.lte(BIG_ZERO)) {
    currentTask = ETask.PurchaseExecutions
  }
  else if (networkContracts.length <= 0) {
    currentTask = ETask.RegisterContracts
  }

  return (
    <Card
      className={[classes.root, className].join(" ")}
      {...rest}
    >
      <CardContent>
        <Grid
          container
          justify="space-between"
          spacing={3}
        >
          <Grid item style={{ flex:1 }}>
            <Typography
              color="textSecondary"
              gutterBottom
              variant="h6"
            >
              WHAT NEXT
            </Typography>
            <Typography
              color="textPrimary"
              variant="body1"
              style={{marginBottom:"0.35em"}}
            >
              {TASKS[currentTask].title}
            </Typography>
            <Link component={RouterLink} to={TASKS[currentTask].link}>{TASKS[currentTask].linkLabel} &rsaquo;</Link>
          </Grid>
          <Grid item>
            {currentTask !== totalTasks && <Avatar className={classes.avatar}>
              <HelpIcon />
            </Avatar>}
            {currentTask === totalTasks && <Avatar className={classes.avatarReady}>
              <ReadyIcon />
            </Avatar>}
          </Grid>
        </Grid>
        <Box mt={3}>
          <LinearProgress
            value={currentTask * 100 / totalTasks}
            variant="determinate"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default TasksProgress;
