import RLogin, { RLoginButton } from "@rsksmart/rlogin";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { providers } from "ethers";
import { useCallback } from "react";
import useConnector from "./useConnector";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Layout from "../shared/Layout";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Loading from "../shared/Loading";
import shallow from "zustand/shallow";

const rLogin = new RLogin({
  cachedProvider: false, // change to true to cache user's wallet choice
  providerOptions: {
    // read more about providers setup in https://github.com/web3Modal/web3modal/
    walletconnect: {
      package: WalletConnectProvider, // setup wallet connect for mobile wallet support
      options: {
        rpc: {
          31: "https://public-node.testnet.rsk.co", // use RSK public nodes to connect to the testnet
        },
      },
    },
  },
  supportedChains: [31], // enable rsk testnet network
});

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

const Connect = () => {
  const classes = useStyles();

  const [setConnection, isLoading] = useConnector(
    (state) => [state.setConnection, state.isLoading],
    shallow
  );

  const connect = useCallback(async () => {
    const { provider } = await rLogin.connect();

    const [account] = await provider.request({ method: "eth_accounts" });

    if (account) {
      setConnection(account, new providers.Web3Provider(provider));
    }
  }, [setConnection]);

  return (
    <Layout hideMenu>
      {!isLoading && (
        <Card className={classes.root} variant="outlined">
          <CardHeader title="Connect" />
          <CardContent>
            <Typography variant="body2" color="textSecondary" component="p">
              In order to use this app you need to connect it with your wallet.
            </Typography>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 24,
              }}
            >
              <RLoginButton onClick={connect}>Connect wallet</RLoginButton>
            </div>
          </CardContent>
        </Card>
      )}
      <Loading isLoading={isLoading} />
    </Layout>
  );
};

export default Connect;
