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
import Button from '@material-ui/core/Button';
import lockSvg from "../assets/illustrations/lock.svg";

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

  const [connect, isLoading] = useConnector(
    (state) => [state.connect, state.isLoading],
    shallow
  );

  const handleConnect = useCallback(async () => {
    const { provider, disconnect } = await rLogin.connect();

    connect(provider, disconnect);
  }, [connect]);

  useEffect(() => {
    if (isRLoginConnected()) {
      handleConnect()
    }
  }, [handleConnect])

  return (
    <Layout hideMenu>
      {!isLoading && (
        <Card className={classes.root} variant="outlined" style={{
          height: "100%",
          backgroundColor: "#333",
          backgroundImage: `url(${lockSvg})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right -60px top -20px",
          backgroundSize: "160px 160px",
        }}>
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
              <Button variant="contained" color="primary" onClick={handleConnect}>
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
