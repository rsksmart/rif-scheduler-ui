import Layout from "../shared/Layout";
import Contracts from "./Contracts";
import Executions from "./Executions";
import Network from "./Network";
import Schedule from "./Schedule";
import ScheduleHistory from "./ScheduleHistory";
import TasksProgress from "./TasksProgress";

const Home = () => {
  return (
    <Layout>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 2fr))",
          gridAutoRows: "180px",
          gridGap: "5px",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: 800,
        }}
      >
        <TasksProgress />
        <Network />
        <Executions />
        <Contracts />
        <Schedule />
        <ScheduleHistory />
      </div>
    </Layout>
  );
};

export default Home;
