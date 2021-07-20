import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Layout from "../shared/Layout";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import useProviders from "./useProviders";
import Loading from "../shared/Loading";
import NetworkLabel from "../connect/NetworkLabel";
import { Divider } from "@material-ui/core";
import Providers from "./Providers";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      width: "100%",
      maxWidth: 800,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0
    },
    divider: {
      width: "100%",
      maxWidth: 800,
    }
  })
);

const Store = () => {
  const classes = useStyles();

  const isLoading = useProviders(
    (state) => state.isLoading
  );

  return (
    <Layout>
      <Card className={classes.root}>
        <CardHeader action={<NetworkLabel />} title="Store" />
        <CardContent>
          <Typography variant="body2" color="textSecondary" component="p">
            Here you can purchase executions.
          </Typography>
        </CardContent>
      </Card>
      <Divider className={classes.divider} />

      <div
        className={classes.root}
        style={{
          //marginTop: 15,
        }}
      >
        <Providers />
      </div>

      <Loading isLoading={isLoading} />
    </Layout>
  );
};

export default Store;
