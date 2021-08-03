import {
  makeStyles,
  createStyles,
  withStyles,
  Theme,
} from "@material-ui/core/styles";
import LinearProgress from "@material-ui/core/LinearProgress";
import { Divider } from "@material-ui/core";
import { memo } from "react";
import { useDelayMount } from "../shared/useDelayMount";

const BorderLinearProgress = withStyles((theme: Theme) =>
  createStyles({
    root: {
      height: 2,
      borderRadius: 0,
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
  },
  divider: {
    height: 2,
    width: "100%",
    maxWidth: 800,
  },
});

const Loading: React.FC<{ isLoading: boolean }> = memo(({ isLoading }) => {
  const classes = useStyles();

  const mounted = useDelayMount(330);

  const loadingResult = mounted && isLoading;

  return (
    <div className={classes.root}>
      {loadingResult && <BorderLinearProgress variant="indeterminate" />}
      {!loadingResult && <Divider className={classes.divider} />}
    </div>
  );
});

export default Loading;
