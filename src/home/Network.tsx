import {
  Avatar,
  Card,
  CardContent,
  Grid,
  Typography,
  makeStyles,
  colors,
} from "@material-ui/core";
import NetworkIcon from "@material-ui/icons/WifiTethering";
import NetworkLabel from "../connect/NetworkLabel";

const useStyles = makeStyles(() => ({
  root: {
    height: "100%",
  },
  avatar: {
    backgroundColor: colors.blueGrey[600],
    height: 56,
    width: 56,
  },
}));

const Network = ({ className, ...rest }: any) => {
  const classes = useStyles();

  return (
    <Card className={[classes.root, className].join(" ")} {...rest}>
      <CardContent>
        <Grid container justify="space-between" spacing={3}>
          <Grid item style={{ flex: 1 }}>
            <Typography color="textSecondary" gutterBottom variant="h6">
              NETWORK
            </Typography>
            <NetworkLabel />
          </Grid>
          <Grid item>
            <Avatar className={classes.avatar}>
              <NetworkIcon />
            </Avatar>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default Network;
