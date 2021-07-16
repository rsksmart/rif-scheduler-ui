import "date-fns";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Layout from "../shared/Layout";

import History from "./History";
import ScheduleForm from "./ScheduleForm";

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

const Schedule = () => {
  const classes = useStyles();

  return (
    <Layout>
      <ScheduleForm />
      <div
        className={classes.root} //marginTop: 15,
      >
        <History />
      </div>
    </Layout>
  );
};

export default Schedule;
