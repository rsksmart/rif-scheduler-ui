import useConnector from "./useConnector";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Layout from "../shared/Layout";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import shallow from "zustand/shallow";
import {
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@material-ui/core";
import AccountIcon from "@material-ui/icons/AccountBalanceWalletOutlined";
import DisconnectIcon from "@material-ui/icons/ExitToApp";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      width: "100%",
      maxWidth: 800,
    },
  })
);

const Account = () => {
  const classes = useStyles();

  const [setConnection, account] = useConnector(
    (state) => [state.setConnection, state.account],
    shallow
  );

  return (
    <Layout>
      <Card className={classes.root} variant="outlined">
        <CardHeader title="Account" />
        <CardContent style={{ padding: 0 }}>
          <List className={classes.root}>
            <ListItem>
              <ListItemIcon>
                <AccountIcon />
              </ListItemIcon>
              <ListItemText primary={"Wallet"} secondary={account} />
            </ListItem>
            <Divider />
            <ListItem button>
              <ListItemIcon>
                <DisconnectIcon />
              </ListItemIcon>
              <ListItemText primary={"Disconnect"} />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default Account;
