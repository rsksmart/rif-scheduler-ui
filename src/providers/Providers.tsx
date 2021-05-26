import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Layout from "../shared/Layout";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import useProviders from "./useProviders";
import shallow from "zustand/shallow";
import Loading from "../shared/Loading";
import PurchaseExecutions from "./PurchaseExecutions";

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

const Providers = () => {
  const classes = useStyles();

  const [providers, isLoading] = useProviders(
    (state) => [state.providers, state.isLoading],
    shallow
  );

  return (
    <Layout>
      <Card className={classes.root} variant="outlined">
        <CardHeader title="Providers" />
        <CardContent>
          <Typography variant="body2" color="textSecondary" component="p">
            Here you can see the service providers currently available and
            purchase its execution plans.
          </Typography>
        </CardContent>
      </Card>

      <Loading isLoading={isLoading} />

      <div
        className={classes.root}
        style={{
          // marginTop: 15,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, 250px)",
          gridAutoRows: "180px",
          gridGap: "20px",
          justifyContent: "space-between",
        }}
      >
        {Object.entries(providers).map(([id, provider]) => (
          <PurchaseExecutions key={`provider-list-${id}`} provider={provider} />
        ))}
      </div>
    </Layout>
  );
};

export default Providers;
