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
import StoreIcon from "@material-ui/icons/Store";
import useConnector from "../connect/useConnector";
import { formatBigNumber } from "../shared/formatters";
import useProviders from "../store/useProviders.old";
import { Link as RouterLink } from "react-router-dom";
import { BIG_ZERO, executionsLeft } from "../shared/reduceExecutionsLeft";

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

const Executions = ({ className, ...rest }: any) => {
  const classes = useStyles();

  const connectedToNetwork = useConnector((state) => state.network);

  const providers = useProviders((state) => state.providers);

  const networkProviders = Object.entries(providers).filter(
    ([id, provider]) => provider.network === connectedToNetwork
  );

  const executionsLeftResult = networkProviders.reduce(
    (accumulated, [id, provider]) => {
      const providerExecutionsLeft = provider.plansPurchaseStatus.reduce(
        executionsLeft,
        BIG_ZERO
      );

      return accumulated.add(providerExecutionsLeft);
    },
    BIG_ZERO
  );

  return (
    <Card className={[classes.root, className].join(" ")} {...rest}>
      <CardContent>
        <Grid container justify="space-between" spacing={3}>
          <Grid item style={{ flex: 1 }}>
            <Typography color="textSecondary" gutterBottom variant="h6">
              REMAINING EXECUTIONS
            </Typography>
            <Typography color="textPrimary" variant="h3">
              {formatBigNumber(executionsLeftResult, 0)}
            </Typography>
            <Link component={RouterLink} color="textSecondary" to="/store">
              Go to store &rsaquo;
            </Link>
          </Grid>
          <Grid item>
            <Avatar className={classes.avatar}>
              <StoreIcon />
            </Avatar>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default Executions;
