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
import AccountIcon from "@material-ui/icons/AccountBalanceWallet";
import DisconnectIcon from "@material-ui/icons/ExitToApp";
import { useSnackbar } from "notistack";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      width: "100%",
      maxWidth: 800,
    },
    overflowEllipsis: {
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      overflow: "hidden",
    },
  })
);

const Account = () => {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();

  const [, account] = useConnector(
    (state) => [state.setConnection, state.account],
    shallow
  );

  const handleAccountClick = () => {
    if (!navigator?.clipboard) {
      enqueueSnackbar("Your browser can't access the clipboard", {
        variant: "error",
      });
      return;
    }

    navigator.clipboard.writeText(account as string);
    enqueueSnackbar("Copied!");
  };

  return (
    <Layout>
      <Card className={classes.root} variant="outlined">
        <CardHeader title="Account" />
        <CardContent style={{ padding: 0 }}>
          <List className={classes.root}>
            <ListItem button onClick={handleAccountClick}>
              <ListItemIcon>
                <AccountIcon />
              </ListItemIcon>
              <ListItemText
                primary={"Wallet"}
                secondary={account}
                classes={{ secondary: classes.overflowEllipsis }}
              />
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
