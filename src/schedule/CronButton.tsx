import {
  FormControl,
  IconButton,
  InputAdornment,
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

import Cron from "cron-converter";

export const CRON_DEFAULT = "0 0 */1 * *";

const cronConverter = new Cron();

enum ECronArrayDefinition {
  Minute = 0,
  Hour = 1,
  Day = 2,
  Month = 3,
  DayWeek = 4,
}

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
  value: string;
  onChange: (event: { target: { value: string } }) => void;
}

enum ERepetitionOption {
  Day,
  Week,
  Month,
  Year,
}

enum EWeekDay {
  Sunday,
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
}

const WEEK_LIST = [
  EWeekDay.Sunday,
  EWeekDay.Monday,
  EWeekDay.Tuesday,
  EWeekDay.Wednesday,
  EWeekDay.Thursday,
  EWeekDay.Friday,
  EWeekDay.Saturday,
];

const WEEK_LABEL = {
  [EWeekDay.Sunday]: "S",
  [EWeekDay.Monday]: "M",
  [EWeekDay.Tuesday]: "T",
  [EWeekDay.Wednesday]: "W",
  [EWeekDay.Thursday]: "T",
  [EWeekDay.Friday]: "F",
  [EWeekDay.Saturday]: "S",
};

const getRepetitionOptionLabels = (repetition: number) => ({
  [ERepetitionOption.Day]: repetition > 1 ? "days" : "day",
  [ERepetitionOption.Week]: repetition > 1 ? "weeks" : "week",
  [ERepetitionOption.Month]: repetition > 1 ? "months" : "month",
  [ERepetitionOption.Year]: repetition > 1 ? "years" : "year",
});

enum EMonths {
  January,
  February,
  March,
  April,
  May,
  June,
  July,
  August,
  September,
  October,
  November,
  December,
}

const MONTHS_LIST = [
  EMonths.January,
  EMonths.February,
  EMonths.March,
  EMonths.April,
  EMonths.May,
  EMonths.June,
  EMonths.July,
  EMonths.August,
  EMonths.September,
  EMonths.October,
  EMonths.November,
  EMonths.December,
];

const MONTHS_LABEL = {
  [EMonths.January]: "January",
  [EMonths.February]: "February",
  [EMonths.March]: "March",
  [EMonths.April]: "April",
  [EMonths.May]: "May",
  [EMonths.June]: "June",
  [EMonths.July]: "July",
  [EMonths.August]: "August",
  [EMonths.September]: "September",
  [EMonths.October]: "October",
  [EMonths.November]: "November",
  [EMonths.December]: "December",
};

enum EMidday {
  AM,
  PM,
}

const convertCronStringToArray = (expression: string) => {
  try {
    return cronConverter.fromString(expression).toArray();
  } catch {
    return cronConverter.fromString(CRON_DEFAULT).toArray();
  }
};

const convertCronArrayToString = (array: Cron.CronArray) => {
  return cronConverter.fromArray(array).toString();
};

const CronButton: React.FC<ICronButtonProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [repetition, setRepetition] = useState(1);
  const [repeatAtHour, setRepeatAtHour] = useState(12);
  const [repeatAtMinute, setRepeatAtMinute] = useState(0);
  const [repeatAtMidday, setRepeatAtMidday] = useState(EMidday.AM);
  const [repeatOnDay, setRepeatOnDay] = useState<EWeekDay[]>([EWeekDay.Monday]);
  const [repeatOnMonth, setRepeatOnMonth] = useState<EMonths[]>([
    EMonths.January,
  ]);
  const [repeatOnMonthDay, setRepeatOnMonthDay] = useState<number[]>([1]);
  const [repetitionOption, setRepetitionOption] = useState(
    ERepetitionOption.Day
  );
  const repetitionOptionLabels = getRepetitionOptionLabels(repetition);

  const classes = useStyles();
  const theme = useTheme();

  const handleClear = () => {
    setRepetition(1);
    setRepeatAtHour(12);
    setRepeatAtMinute(0);
    setRepeatAtMidday(EMidday.AM);
    setRepeatOnDay([EWeekDay.Monday]);
    setRepeatOnMonth([EMonths.January]);
    setRepeatOnMonthDay([1]);
    setRepetitionOption(ERepetitionOption.Day);
  };

  const handleClose = () => {
    handleClear();
    setOpen(false);
  };

  const handleRepetitionIncrement = (increment: number) => (event: any) => {
    let result = repetition + increment;

    if (result <= 1) result = 1;

    setRepetition(result);
  };

  const handleRepeatOnDay = (day: EWeekDay) => () => {
    if (repeatOnDay.includes(day)) {
      if (repeatOnDay.length <= 1) {
        return;
      }
      setRepeatOnDay(repeatOnDay.filter((x) => x !== day));
    } else {
      setRepeatOnDay([...repeatOnDay, day]);
    }
  };

  const handleRepeatOnMonthDay = (day: number) => () => {
    if (repeatOnMonthDay.includes(day)) {
      if (repeatOnMonthDay.length <= 1) {
        return;
      }
      setRepeatOnMonthDay(repeatOnMonthDay.filter((x) => x !== day));
    } else {
      setRepeatOnMonthDay([...repeatOnMonthDay, day]);
    }
  };

  const handleRepeatOnMonth = (month: EMonths) => () => {
    if (repeatOnMonth.includes(month)) {
      if (repeatOnMonth.length <= 1) {
        return;
      }
      setRepeatOnMonth(repeatOnMonth.filter((x) => x !== month));
    } else {
      setRepeatOnMonth([...repeatOnMonth, month]);
    }
  };

  const handleOkButton = () => {
    let currentValueArray: Cron.CronArray = [[], [], [], [], []];

    if (repeatAtMidday === EMidday.AM)
      currentValueArray[ECronArrayDefinition.Hour][0] =
        repeatAtHour === 12 ? 0 : repeatAtHour;

    if (repeatAtMidday === EMidday.PM)
      currentValueArray[ECronArrayDefinition.Hour][0] =
        repeatAtHour === 12 ? 12 : repeatAtHour + 12;

    currentValueArray[ECronArrayDefinition.Minute][0] = repeatAtMinute;

    if (repetitionOption === ERepetitionOption.Day) {
      currentValueArray[ECronArrayDefinition.Day] = arrayFromWithStep(
        Array.from(Array(31).keys()).map((x) => x + 1),
        repetition
      );

      currentValueArray[ECronArrayDefinition.Month] = MONTHS_LIST.map(
        (x) => x + 1
      );

      currentValueArray[ECronArrayDefinition.DayWeek] = WEEK_LIST;
    } else if (repetitionOption === ERepetitionOption.Week) {
      const weeksRepetitionStart = arrayFromWithStep(
        Array.from(Array(31).keys()).map((x) => x + 1),
        repetition * 7
      );

      currentValueArray[ECronArrayDefinition.Day] = weeksRepetitionStart
        .map((currentValue) =>
          arrayFromWithStep(
            Array.from(Array(7).keys()).map((x) => x + currentValue),
            1
          )
        )
        .reduce((acc, curVal) => acc.concat(curVal), [])
        .filter((x) => x <= 31);

      currentValueArray[ECronArrayDefinition.Month] = MONTHS_LIST.map(
        (x) => x + 1
      );

      currentValueArray[ECronArrayDefinition.DayWeek] = repeatOnDay;
    } else if (repetitionOption === ERepetitionOption.Month) {
      currentValueArray[ECronArrayDefinition.Day] = repeatOnMonthDay;

      currentValueArray[ECronArrayDefinition.Month] = arrayFromWithStep(
        MONTHS_LIST.map((x) => x + 1),
        repetition
      );

      currentValueArray[ECronArrayDefinition.DayWeek] = WEEK_LIST;
    } else if (repetitionOption === ERepetitionOption.Year) {
      currentValueArray[ECronArrayDefinition.Day] = repeatOnMonthDay;

      currentValueArray[ECronArrayDefinition.Month] = repeatOnMonth.map(
        (x) => x + 1
      );

      currentValueArray[ECronArrayDefinition.DayWeek] = WEEK_LIST;
    }

    const expression = convertCronArrayToString(currentValueArray);

    onChange({ target: { value: expression } });
    handleClose();
  };

  useEffect(() => {
    // TODO: needs more work

    const currentValue = value === "" ? CRON_DEFAULT : value;

    const currentValueArray = convertCronStringToArray(currentValue);

    const isDaily = currentValueArray[ECronArrayDefinition.Day].length === 31;

    const time = tConvert(
      currentValueArray[ECronArrayDefinition.Hour][0],
      currentValueArray[ECronArrayDefinition.Minute][0]
    );

    console.log({
      currentValueArray,
      time,
      isDaily,
    });
  }, [value]);

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
              value={repetition}
              hiddenLabel
              onChange={(event) => setRepetition(+event.target.value)}
              disabled={repetitionOption === ERepetitionOption.Year}
              InputProps={{
                inputComponent: NumberInput as any,
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                      size="small"
                      aria-label="sub 10 quantity"
                      onClick={handleRepetitionIncrement(-1)}
                      edge="start"
                      disabled={repetitionOption === ERepetitionOption.Year}
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
                      onClick={handleRepetitionIncrement(1)}
                      edge="end"
                      disabled={repetitionOption === ERepetitionOption.Year}
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
              <Select
                value={repetitionOption}
                onChange={(event) => {
                  const option = event.target.value as ERepetitionOption;
                  setRepetitionOption(option);
                  if (option === ERepetitionOption.Year) {
                    setRepetition(1);
                  }
                }}
              >
                <MenuItem value={ERepetitionOption.Day}>
                  {repetitionOptionLabels[ERepetitionOption.Day]}
                </MenuItem>
                <MenuItem value={ERepetitionOption.Week}>
                  {repetitionOptionLabels[ERepetitionOption.Week]}
                </MenuItem>
                <MenuItem value={ERepetitionOption.Month}>
                  {repetitionOptionLabels[ERepetitionOption.Month]}
                </MenuItem>
                <MenuItem value={ERepetitionOption.Year}>
                  {repetitionOptionLabels[ERepetitionOption.Year]}
                </MenuItem>
              </Select>
            </FormControl>
          </div>

          {repetitionOption === ERepetitionOption.Week && (
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
                    color={repeatOnDay.includes(week) ? "primary" : "default"}
                    onClick={handleRepeatOnDay(week)}
                  />
                ))}
              </div>
            </>
          )}

          {[ERepetitionOption.Month, ERepetitionOption.Year].includes(
            repetitionOption
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

          {repetitionOption === ERepetitionOption.Year && (
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
                      repeatOnMonth.includes(month) ? "primary" : "default"
                    }
                    onClick={handleRepeatOnMonth(month)}
                  />
                ))}
              </div>
            </>
          )}

          {[ERepetitionOption.Month, ERepetitionOption.Year].includes(
            repetitionOption
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
                      repeatOnMonthDay.includes(day + 1) ? "primary" : "default"
                    }
                    onClick={handleRepeatOnMonthDay(day + 1)}
                  />
                ))}
              </div>
            </>
          )}

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
                value={repeatAtHour}
                onChange={(event) =>
                  setRepeatAtHour(parseInt(event.target.value as string))
                }
              >
                {Array.from(Array(12).keys())
                  .reverse()
                  .map((value) => (
                    <MenuItem value={value + 1}>{value + 1}</MenuItem>
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
                value={repeatAtMinute}
                onChange={(event) =>
                  setRepeatAtMinute(parseInt(event.target.value as string))
                }
              >
                {Array.from(Array(60).keys())
                  .filter((x) => x % 5 === 0)
                  .map((value) => (
                    <MenuItem value={value}>
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
                value={repeatAtMidday}
                onChange={(event) =>
                  setRepeatAtMidday(event.target.value as EMidday)
                }
              >
                <MenuItem value={EMidday.AM}>am</MenuItem>
                <MenuItem value={EMidday.PM}>pm</MenuItem>
              </Select>
            </FormControl>
          </div>
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

function tConvert(hour: number, minute: number) {
  return {
    hour: hour % 12 || 12,
    minute: minute,
    midday: hour < 12 ? "AM" : "PM",
  };
}

function arrayFromWithStep(array: number[], step: number) {
  const result: number[] = [];
  for (let index = 0; index < array.length; index += step) {
    result.push(array[index]);
  }

  return result;
}
