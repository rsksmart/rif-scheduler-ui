import { useCallback, useEffect } from "react";
import useConnector from "./useConnector";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Layout from "../shared/Layout";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Loading from "../shared/Loading";
import shallow from "zustand/shallow";
import { isRLoginConnected, rLogin } from "./rLogin";
import Button from "@material-ui/core/Button";
import lockSvg from "../assets/illustrations/lock.svg";
import { useHistory, useLocation } from "react-router-dom";

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

  const history = useHistory();
  const location = useLocation<any>();

  const { from } = location.state || { from: { pathname: "/" } };

  const [connect, disconnect, isLoading] = useConnector(
    (state) => [state.connect, state.disconnect, state.isLoading],
    shallow
  );

  const handleConnect = useCallback(async () => {
    try {
      const wait = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      const timeout = (p: Promise<any>, ms: number) =>
        Promise.race([
          p,
          wait(ms).then(() => {
            throw new Error("Timeout after " + ms + " ms");
          }),
        ]);

      const { provider, disconnect } = await timeout(rLogin.connect(), 30000);

      connect(provider, disconnect).then(() => history.replace(from));
    } catch (error) {
      console.error("handleConnect error:", error);
      disconnect();
    }
  }, [connect, disconnect, from, history]);

  useEffect(() => {
    if (isRLoginConnected()) {
      handleConnect();
    }
  }, [handleConnect]);

  return (
    <Layout hideMenu>
      {!isLoading && (
        <Card
          className={classes.root}
          style={{
            height: "100%",
            backgroundImage: `url(${lockSvg})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right -60px top -20px",
            backgroundSize: "160px 160px",
          }}
        >
          <CardHeader title="Wallet connection" />
          <CardContent>
            <Typography variant="subtitle1" color="textSecondary" component="p">
              Let's connect your wallet to start scheduling executions.
            </Typography>
            <div
              style={{
                display: "flex",
                // justifyContent: "center",
                marginTop: 24,
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={handleConnect}
              >
                Connect now!
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Loading isLoading={isLoading} />
    </Layout>
  );
};

export default Connect;
