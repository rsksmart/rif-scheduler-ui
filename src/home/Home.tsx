import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Layout from "../shared/Layout";
import Contracts from "./Contracts";
import Executions from "./Executions";
import Schedule from "./Schedule";
import ScheduleHistory from "./ScheduleHistory";
import TasksProgress from "./TasksProgress";

import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import NetworkLabel from "../connect/NetworkLabel";
import Divider from "@material-ui/core/Divider";

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
    divider: {
      width: "100%",
      maxWidth: 800,
    },
  })
);

const Home = () => {
  const classes = useStyles();

  return (
    <Layout>
      <Card className={classes.root}>
        <CardHeader action={<NetworkLabel />} title="WHAT'S NEXT?" />
        <CardContent>
          <TasksProgress />
        </CardContent>
      </Card>
      <Divider className={classes.divider} />
      <div
        style={{
          marginTop: 15,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 2fr))",
          gridAutoRows: "180px",
          gridGap: "5px",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: 800,
        }}
      >
        <Executions />
        <Contracts />
        <Schedule />
        <ScheduleHistory />
      </div>
    </Layout>
  );
};

export default Home;
