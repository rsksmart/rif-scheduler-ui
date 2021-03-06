import {
  makeStyles,
  createStyles,
  withStyles,
  Theme,
} from "@material-ui/core/styles";
import LinearProgress from "@material-ui/core/LinearProgress";
import { memo } from "react";
import { useDelayMount } from "./useDelayMount";

const BorderLinearProgress = withStyles((theme: Theme) =>
  createStyles({
    root: {
      height: 10,
      borderRadius: 5,
    },
    colorPrimary: {
      backgroundColor:
        theme.palette.grey[theme.palette.type === "light" ? 200 : 700],
    },
    bar: {
      borderRadius: 5,
      backgroundColor: "#1a90ff",
    },
  })
)(LinearProgress);

const useStyles = makeStyles({
  root: {
    width: "100%",
    maxWidth: 800,
    marginTop: 2.5,
    marginBottom: 2.5,
  },
});

const Loading: React.FC<{ isLoading: boolean }> = memo(({ isLoading }) => {
  const classes = useStyles();

  const mounted = useDelayMount(330);

  const loadingResult = mounted && isLoading;

  return (
    <div className={classes.root}>
      {loadingResult && <BorderLinearProgress variant="indeterminate" />}
      {!loadingResult && <div style={{ height: 10 }} />}
    </div>
  );
});

export default Loading;
