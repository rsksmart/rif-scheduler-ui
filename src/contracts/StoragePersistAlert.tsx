import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import { CardActions } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import { useEffect, useState } from "react";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      width: "100%",
      maxWidth: 800,
      marginTop: 15,
    },
  })
);

const StoragePersistAlert = () => {
  const classes = useStyles();

  const isPersistStorageAvailable =
    navigator.storage && (navigator.storage.persist as any) ? true : false;

  const [showAlert, setShowAlert] = useState(false);
  const [enableClicked, setEnableClicked] = useState(false);

  useEffect(() => {
    const action = async () => {
      if (!isPersistStorageAvailable) return;

      const isPersisted = await navigator.storage.persisted();

      if (!isPersisted) {
        setShowAlert(true);
      }
    };

    action();
  }, [isPersistStorageAvailable]);

  const handleEnable = async () => {
    setEnableClicked(true);
    const isPersisted = await navigator.storage.persist();
    setShowAlert(!isPersisted);
  };

  return (
    <>
      {showAlert && (
        <Card className={classes.root}>
          <CardHeader title={"Persist Storage"} />
          <CardContent>
            <Typography variant="body2" color="textSecondary" component="p">
              This is a decentralized web application which means your data is
              only saved in this browser, so we recommend enabling persistent
              storage to prevent your data from being deleted automatically by
              your browser.
            </Typography>
          </CardContent>
          <CardActions style={{ justifyContent: "flex-end" }}>
            <Button
              onClick={handleEnable}
              color="primary"
              variant="contained"
              disabled={enableClicked}
            >
              Enable
            </Button>
          </CardActions>
        </Card>
      )}
    </>
  );
};

export default StoragePersistAlert;
