import { IconButton, Typography, useTheme } from "@material-ui/core";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";

import EditIcon from "@material-ui/icons/Edit";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useState } from "react";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    dialogPaper: {
      margin: 0,
    },
  })
);

interface ICronButtonProps {
  disabled: boolean;
}

const CronButton: React.FC<ICronButtonProps> = ({ disabled }) => {
  const [open, setOpen] = useState(false);
  //const [value, setValue] = useState("* * * * *");

  const classes = useStyles();
  const theme = useTheme();

  return (
    <>
      <IconButton
        aria-label="edit cron expression"
        onClick={() => setOpen(true)}
        edge="end"
        disabled={disabled}
      >
        <EditIcon />
      </IconButton>
      <Dialog
        fullWidth={false}
        classes={{
          paper: classes.dialogPaper,
        }}
        maxWidth={"xs"}
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="cron-expression-dialog-title"
      >
        <DialogTitle
          disableTypography
          id="cron-expression-dialog-title"
          style={{ height: 100, backgroundColor: theme.palette.primary.main }}
        >
          <Typography
            component="h2"
            variant="h6"
            style={{ color: theme.palette.primary.contrastText }}
          >
            Recurrence
          </Typography>
          <Typography
            component="h3"
            variant="caption"
            style={{ color: theme.palette.primary.contrastText }}
          >
            You can select the periodicity for the contract execution.
          </Typography>
        </DialogTitle>
        <DialogContent></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CronButton;
