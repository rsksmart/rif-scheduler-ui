import {
  makeStyles,
  createStyles,
  withStyles,
  Theme,
} from "@material-ui/core/styles";
import LinearProgress from "@material-ui/core/LinearProgress";

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

const Loading = ({ isLoading }: any) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      {isLoading && <BorderLinearProgress variant="indeterminate" />}
      {!isLoading && <div style={{ height: 10 }} />}
    </div>
  );
};

export default Loading;
