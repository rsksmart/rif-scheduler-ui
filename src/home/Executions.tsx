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
import { formatBigNumber } from "../shared/formatters";
import { Link as RouterLink } from "react-router-dom";
import { BIG_ZERO } from "../shared/reduceExecutionsLeft";
import { useState } from "react";
import { useEffect } from "react";
import { useProvidersStore } from "../sdk-hooks/useProviders";
import { getExecutionsLeftTotal } from "../sdk-hooks/getExecutionsLeftTotal";

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

  const [executionsLeft, setExecutionsLeft] = useState(BIG_ZERO);
  const providers = useProvidersStore((state) => state.providers);

  useEffect(() => {
    getExecutionsLeftTotal(providers).then((total) => setExecutionsLeft(total));
  }, [providers]);

  return (
    <Card className={[classes.root, className].join(" ")} {...rest}>
      <CardContent>
        <Grid container justify="space-between" spacing={3}>
          <Grid item style={{ flex: 1 }}>
            <Typography color="textSecondary" gutterBottom variant="h6">
              REMAINING EXECUTIONS
            </Typography>
            <Typography color="textPrimary" variant="h3">
              {formatBigNumber(executionsLeft, 0)}
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
