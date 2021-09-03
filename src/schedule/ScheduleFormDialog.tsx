import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import NetworkLabel from "../connect/NetworkLabel";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import { Alert, Color } from "@material-ui/lab";
import { Link as RouterLink } from "react-router-dom";
import { ReactNode } from "react";
import { useState } from "react";
import { useEffect } from "react";

interface IScheduleFormDialogProps {
  onClose: () => void;
  onConfirm: () => void;
  alerts?: IScheduleFormDialogAlert[];
}

export interface IScheduleFormDialogAlert {
  severity: Color;
  message: string;
  actionLabel?: string;
  actionLink?: string;
  actionButton?: (onRevalidate: () => void) => ReactNode;
}

const ScheduleFormDialog = ({
  alerts = [],
  onClose,
  onConfirm,
}: IScheduleFormDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [currentAlerts, setCurrentAlerts] = useState(alerts);

  useEffect(() => {
    if (JSON.stringify(alerts) === JSON.stringify(currentAlerts)) return;

    setCurrentAlerts(alerts);
  }, [alerts, currentAlerts]);

  const open = alerts.length > 0 ? true : false;

  if (alerts.length === 0) return null;

  const hasErrors = currentAlerts.some((x) => x.severity === "error");

  const handleRevalidate = (index: number) => () => {
    setCurrentAlerts((prev) => {
      const result = [...prev];
      result.splice(index, 1);

      return result;
    });
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth={true}
      open={open}
      onClose={onClose}
    >
      <DialogTitle>
        <div style={{ display: "flex", flex: 1 }}>
          <div style={{ display: "flex", flex: 1 }}>
            {currentAlerts.length === 0 ? "Resolved!" : "Requires your review!"}
          </div>
          <NetworkLabel />
        </div>
      </DialogTitle>
      <DialogContent
        style={{ display: "flex", flexDirection: "column", gap: "5px" }}
      >
        {currentAlerts.length === 0 && (
          <Alert severity={"success"}>It's all good now.</Alert>
        )}
        {currentAlerts.map((alert, index) => (
          <Alert
            key={`form-alert-${index}`}
            severity={alert.severity}
            action={
              <>
                {alert.actionLabel && alert.actionLink && (
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to={alert.actionLink}
                    size="small"
                  >
                    {alert.actionLabel}
                  </Button>
                )}
                {alert.actionButton &&
                  alert.actionButton(handleRevalidate(index))}
              </>
            }
          >
            {alert.message}
          </Alert>
        ))}
      </DialogContent>
      <DialogActions
        style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 24 }}
      >
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        {!hasErrors && (
          <Button onClick={onConfirm} color="secondary" variant="contained">
            {currentAlerts.length === 0 ? "Schedule!" : "Schedule anyway!"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleFormDialog;
