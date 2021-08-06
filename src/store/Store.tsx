import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Layout from "../shared/Layout";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import NetworkLabel from "../connect/NetworkLabel";
import PlansList from "./PlansList";
import { useProvidersStore } from "../sdk-hooks/useProviders";
import { memo } from "react";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      width: "100%",
      maxWidth: 800,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
  })
);

const Store = memo(() => {
  const classes = useStyles();

  const providers = useProvidersStore((state) => state.providers);

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
      <div className={classes.root}>
        <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          {providers.map((provider, index) => (
            <PlansList
              key={`plans-list-${index}`}
              expandedFixed={providers.length === 1}
              provider={provider}
            />
          ))}
        </Card>
      </div>
    </Layout>
  );
});

export default Store;
