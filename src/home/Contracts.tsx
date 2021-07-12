
import {
  Avatar,
  Card,
  CardContent,
  Grid,
  Typography,
  makeStyles,
  colors,
  Link
} from '@material-ui/core';
import ContractsIcon from "@material-ui/icons/Extension";
import useConnector from '../connect/useConnector';
import { Link as RouterLink } from "react-router-dom"
import useContracts from '../contracts/useContracts';

const useStyles = makeStyles(() => ({
  root: {
    height: '100%',
  },
  avatar: {
    backgroundColor: colors.blue[600],
    height: 56,
    width: 56
  }
}));

const Contracts = ({ className, ...rest }: any) => {
  const classes = useStyles();

  const connectedToNetwork = useConnector(state => state.network)

  const contracts = useContracts((state) => state.contracts);

  const networkContracts = Object.entries(contracts)
    .filter(([id, contract])=> contract.network === connectedToNetwork)

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
              REGISTERED CONTRACTS
            </Typography>
            <Typography
              color="textPrimary"
              variant="h3"
            >
              {networkContracts.length}
            </Typography>
            <Link component={RouterLink} to="/contracts">Go to contracts &rsaquo;</Link>
          </Grid>
          <Grid item>
            <Avatar className={classes.avatar}>
              <ContractsIcon />
            </Avatar>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default Contracts;
