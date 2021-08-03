import { makeStyles, createStyles, Theme } from "@material-ui/core/styles";
import CircularProgress, {
  CircularProgressProps,
} from "@material-ui/core/CircularProgress";
import { memo } from "react";
import { useDelayMount } from "./useDelayMount";

const useCircleStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      position: "relative",
    },
    bottom: {
      color: theme.palette.grey[theme.palette.type === "light" ? 200 : 700],
    },
    top: {
      color: "#1a90ff",
      animationDuration: "550ms",
      position: "absolute",
      left: 0,
    },
    circle: {
      strokeLinecap: "round",
    },
  })
);

const CustomCircularProgress = (props: CircularProgressProps) => {
  const classes = useCircleStyles();

  return (
    <div className={classes.root}>
      <CircularProgress
        variant="determinate"
        className={classes.bottom}
        size={24}
        thickness={4}
        {...props}
        value={100}
      />
      <CircularProgress
        variant="indeterminate"
        disableShrink
        className={classes.top}
        classes={{
          circle: classes.circle,
        }}
        size={24}
        thickness={4}
        {...props}
      />
    </div>
  );
};

const LoadingCircle: React.FC<{ isLoading: boolean }> = memo(
  ({ isLoading }) => {
    const mounted = useDelayMount(330);

    const loadingResult = mounted && isLoading;

    return (
      <>
        {loadingResult && <CustomCircularProgress />}
        {!loadingResult && <div style={{ height: 24 }} />}
      </>
    );
  }
);

export default LoadingCircle;
