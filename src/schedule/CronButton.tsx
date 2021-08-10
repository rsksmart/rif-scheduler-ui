import {
  FormControl,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
} from "@material-ui/core";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";

import EditIcon from "@material-ui/icons/DateRange";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useEffect, useState } from "react";
import NumberInput from "../shared/NumberInput";

import PlusIcon from "@material-ui/icons/AddCircleRounded";
import MinusIcon from "@material-ui/icons/RemoveCircleRounded";
import Chip from "@material-ui/core/Chip";

import cronstrue from "cronstrue";
import {
  ECronFieldOption,
  EMidday,
  EMonths,
  EWeekDay,
} from "./cronParser/enums";
import {
  getCronFieldOptions,
  MONTHS_LABEL,
  MONTHS_LIST,
  WEEK_LABEL,
  WEEK_LIST,
} from "./cronParser/descriptions";
import {
  convertToCronExpression,
  ICronField,
} from "./cronParser/convertToCronExpression";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    dialogPaper: {
      margin: 0,

      [theme.breakpoints.down("xs")]: {
        maxWidth: "100% !important",
      },
    },
  })
);

interface ICronButtonProps {
  disabled: boolean;
  value: ICronField;
  onChange: (event: { target: { value: ICronField } }) => void;
}

const CronButton: React.FC<ICronButtonProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<ICronField>(value);

  const cronFieldOptions = getCronFieldOptions(fields.every);

  const [cronError, setCronError] = useState<string | null>(null);

  useEffect(() => {
    setFields(value);
  }, [value]);

  const classes = useStyles();
  const theme = useTheme();

  const handleClear = () => {
    setFields(value);
  };

  const handleClose = () => {
    handleClear();
    setOpen(false);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    const newValue = { ...fields, [fieldName]: value };
    const cron = convertToCronExpression(newValue);

    setFields({ ...newValue, ...cron });
  };

  const handleOptionChange = (event: any) => {
    const option = event.target.value as ECronFieldOption;

    let every = fields.every;

    if ([ECronFieldOption.Year, ECronFieldOption.Custom].includes(option)) {
      every = 1; // every is disabled on year and custom
    }

    const newValue = { ...fields, option, every };
    const cron = convertToCronExpression(newValue);

    setFields({ ...newValue, ...cron });
  };

  const handleEveryIncrement = (increment: number) => (event: any) => {
    let result = fields.every + increment;

    if (result <= 1) result = 1;

    handleFieldChange("every", result);
  };

  const handleWeekDaysChange = (day: EWeekDay) => () => {
    if (fields.weekDays.includes(day)) {
      if (fields.weekDays.length <= 1) {
        return;
      }
      handleFieldChange(
        "weekDays",
        fields.weekDays.filter((x) => x !== day)
      );
    } else {
      handleFieldChange("weekDays", [...fields.weekDays, day]);
    }
  };

  const handleMonthDaysChange = (day: number) => () => {
    if (fields.monthDays.includes(day)) {
      if (fields.monthDays.length <= 1) {
        return;
      }
      handleFieldChange(
        "monthDays",
        fields.monthDays.filter((x) => x !== day)
      );
    } else {
      handleFieldChange("monthDays", [...fields.monthDays, day]);
    }
  };

  const handleMonthsChange = (month: EMonths) => () => {
    if (fields.months.includes(month)) {
      if (fields.months.length <= 1) {
        return;
      }
      handleFieldChange(
        "months",
        fields.months.filter((x) => x !== month)
      );
    } else {
      handleFieldChange("months", [...fields.months, month]);
    }
  };

  const handleExpressionChange = (event: any) => {
    const expression = event.target.value;

    setCronError(null);

    setFields((prev) => ({ ...prev, expression }));
    try {
      const description = cronstrue.toString(expression, { verbose: true });

      setFields((prev) => ({ ...prev, description }));
    } catch (error) {
      let message = "";
      if (typeof error === "string") message = error;
      else message = error.message;

      if (message.includes("Error: ")) message = message.replace("Error: ", "");

      setFields((prev) => ({ ...prev, description: "" }));
      setCronError(message);
    }
  };

  const handleOkButton = () => {
    if (fields.option === ECronFieldOption.Custom && cronError) return;

    const cron = convertToCronExpression(fields);

    onChange({ target: { value: { ...fields, ...cron } } });
    handleClose();
  };

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
        scroll="body"
        fullWidth={false}
        classes={{
          paper: classes.dialogPaper,
        }}
        maxWidth={"xs"}
        open={open}
        onClose={handleClose}
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
        <DialogContent style={{ minHeight: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Typography variant="subtitle2">Repeat every</Typography>
            <TextField
              margin="dense"
              variant="filled"
              fullWidth
              style={{ flex: 1, minWidth: 120 }}
              value={fields.every}
              hiddenLabel
              onChange={(event) =>
                handleFieldChange("every", +event.target.value)
              }
              disabled={[
                ECronFieldOption.Year,
                ECronFieldOption.Custom,
              ].includes(fields.option)}
              InputProps={{
                inputComponent: NumberInput as any,
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                      size="small"
                      aria-label="sub 10 quantity"
                      onClick={handleEveryIncrement(-1)}
                      edge="start"
                      disabled={[
                        ECronFieldOption.Year,
                        ECronFieldOption.Custom,
                      ].includes(fields.option)}
                    >
                      <MinusIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="add 10 quantity"
                      onClick={handleEveryIncrement(1)}
                      edge="end"
                      disabled={[
                        ECronFieldOption.Year,
                        ECronFieldOption.Custom,
                      ].includes(fields.option)}
                    >
                      <PlusIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControl
              variant="filled"
              fullWidth
              style={{ flex: 1, minWidth: 90 }}
              margin="dense"
              hiddenLabel
            >
              <Select value={fields.option} onChange={handleOptionChange}>
                <MenuItem value={ECronFieldOption.Day}>
                  {cronFieldOptions[ECronFieldOption.Day]}
                </MenuItem>
                <MenuItem value={ECronFieldOption.Week}>
                  {cronFieldOptions[ECronFieldOption.Week]}
                </MenuItem>
                <MenuItem value={ECronFieldOption.Month}>
                  {cronFieldOptions[ECronFieldOption.Month]}
                </MenuItem>
                <MenuItem value={ECronFieldOption.Year}>
                  {cronFieldOptions[ECronFieldOption.Year]}
                </MenuItem>
                <MenuItem value={ECronFieldOption.Custom}>
                  {cronFieldOptions[ECronFieldOption.Custom]}
                </MenuItem>
              </Select>
            </FormControl>
          </div>

          {fields.option === ECronFieldOption.Week && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  paddingTop: 8,
                }}
              >
                <Typography variant="subtitle2">Repeat on</Typography>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  paddingTop: 8,
                }}
              >
                {WEEK_LIST.map((week, index) => (
                  <Chip
                    key={`cron-week-${index}`}
                    label={WEEK_LABEL[week]}
                    size="small"
                    clickable
                    color={
                      fields.weekDays.includes(week) ? "primary" : "default"
                    }
                    onClick={handleWeekDaysChange(week)}
                  />
                ))}
              </div>
            </>
          )}

          {[ECronFieldOption.Month, ECronFieldOption.Year].includes(
            fields.option
          ) && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  paddingTop: 8,
                }}
              >
                <Typography variant="subtitle2">Repeat on</Typography>
              </div>
            </>
          )}

          {fields.option === ECronFieldOption.Year && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  paddingTop: 8,
                  flexWrap: "wrap",
                }}
              >
                {MONTHS_LIST.map((month, index) => (
                  <Chip
                    key={`cron-month-${index}`}
                    label={MONTHS_LABEL[month]}
                    size="small"
                    clickable
                    color={
                      fields.months.includes(month) ? "primary" : "default"
                    }
                    onClick={handleMonthsChange(month)}
                  />
                ))}
              </div>
            </>
          )}

          {[ECronFieldOption.Month, ECronFieldOption.Year].includes(
            fields.option
          ) && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  paddingTop: 8,
                  flexWrap: "wrap",
                }}
              >
                {Array.from(Array(31).keys()).map((day, index) => (
                  <Chip
                    key={`cron-year-${index}`}
                    label={(day + 1).toString().padStart(2, "0")}
                    size="small"
                    clickable
                    color={
                      fields.monthDays.includes(day + 1) ? "primary" : "default"
                    }
                    onClick={handleMonthDaysChange(day + 1)}
                  />
                ))}
              </div>
            </>
          )}

          {fields.option !== ECronFieldOption.Custom && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  paddingTop: 16,
                }}
              >
                <Typography variant="subtitle2">Repeat at</Typography>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FormControl
                  variant="filled"
                  style={{ flex: 1, maxWidth: 70 }}
                  margin="dense"
                  hiddenLabel
                >
                  <Select
                    value={fields.hour}
                    onChange={(event) =>
                      handleFieldChange(
                        "hour",
                        parseInt(event.target.value as string)
                      )
                    }
                  >
                    {Array.from(Array(12).keys())
                      .reverse()
                      .map((value) => (
                        <MenuItem key={`cron-hour-${value}`} value={value + 1}>
                          {value + 1}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <Typography variant="subtitle2">:</Typography>
                <FormControl
                  variant="filled"
                  style={{ flex: 1, maxWidth: 70 }}
                  margin="dense"
                  hiddenLabel
                >
                  <Select
                    value={fields.minute}
                    onChange={(event) =>
                      handleFieldChange(
                        "minute",
                        parseInt(event.target.value as string)
                      )
                    }
                  >
                    {Array.from(Array(60).keys())
                      .filter((x) => x % 5 === 0)
                      .map((value) => (
                        <MenuItem key={`cron-minute-${value}`} value={value}>
                          {value.toString().padStart(2, "0")}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <FormControl
                  variant="filled"
                  style={{ flex: 1, maxWidth: 70 }}
                  margin="dense"
                  hiddenLabel
                >
                  <Select
                    value={fields.midday}
                    onChange={(event) =>
                      handleFieldChange("midday", event.target.value as EMidday)
                    }
                  >
                    <MenuItem value={EMidday.AM}>am</MenuItem>
                    <MenuItem value={EMidday.PM}>pm</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </>
          )}

          {fields.option === ECronFieldOption.Custom && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  paddingTop: 16,
                }}
              >
                <Typography variant="subtitle2">
                  Learn more about cron expressions&nbsp;
                  <Link
                    component="a"
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://en.wikipedia.org/wiki/Cron"
                  >
                    here
                  </Link>
                </Typography>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <TextField
                  margin="dense"
                  label="Expression"
                  variant="filled"
                  fullWidth
                  style={{ flex: 1, minWidth: 200 }}
                  onChange={handleExpressionChange}
                  error={cronError ? true : false}
                  value={fields.expression}
                  helperText={cronError ? cronError : fields.description}
                />
              </div>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleOkButton} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CronButton;
