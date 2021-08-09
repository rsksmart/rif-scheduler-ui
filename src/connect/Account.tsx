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
import shortText from "../shared/shortText";
import Hidden from "@material-ui/core/Hidden";
import NetworkLabel from "./NetworkLabel";
import { useHistory } from "react-router-dom";

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
  const history = useHistory();

  const { enqueueSnackbar } = useSnackbar();

  const [account, disconnect] = useConnector(
    (state) => [state.account, state.disconnect],
    shallow
  );

  const handleAccountClick = () => {
    if (!navigator?.clipboard) {
      enqueueSnackbar("Your browser can't access the clipboard", {
        variant: "error",
      });
      return;
    }

    navigator.clipboard.writeText(account!);
    enqueueSnackbar("Copied!", { autoHideDuration: 500 });
  };

  return (
    <Layout>
      <Card className={classes.root}>
        <CardHeader action={<NetworkLabel />} title="Account" />
        <CardContent style={{ padding: 0 }}>
          <List className={classes.root}>
            <ListItem button onClick={handleAccountClick}>
              <ListItemIcon>
                <AccountIcon />
              </ListItemIcon>
              <ListItemText
                primary={"Wallet"}
                secondary={
                  <>
                    <Hidden smUp>{shortText(account!)}</Hidden>
                    <Hidden xsDown>{account}</Hidden>
                  </>
                }
                title={account}
                classes={{ secondary: classes.overflowEllipsis }}
              />
            </ListItem>
            <Divider />
            <ListItem
              button
              onClick={() => {
                disconnect();
                history.replace("/");
              }}
            >
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
