import { ECronFieldOption, EMonths, EWeekDay } from "./enums";

export const WEEK_LIST = [
  EWeekDay.Sunday,
  EWeekDay.Monday,
  EWeekDay.Tuesday,
  EWeekDay.Wednesday,
  EWeekDay.Thursday,
  EWeekDay.Friday,
  EWeekDay.Saturday,
];

export const WEEK_LABEL = {
  [EWeekDay.Sunday]: "S",
  [EWeekDay.Monday]: "M",
  [EWeekDay.Tuesday]: "T",
  [EWeekDay.Wednesday]: "W",
  [EWeekDay.Thursday]: "T",
  [EWeekDay.Friday]: "F",
  [EWeekDay.Saturday]: "S",
};

export const getCronFieldOptions = (repetition: number) => ({
  [ECronFieldOption.Day]: repetition > 1 ? "days" : "day",
  [ECronFieldOption.Week]: repetition > 1 ? "weeks" : "week",
  [ECronFieldOption.Month]: repetition > 1 ? "months" : "month",
  [ECronFieldOption.Year]: repetition > 1 ? "years" : "year",
  [ECronFieldOption.Custom]: "advanced",
});

export const MONTHS_LIST = [
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

export const MONTHS_LABEL = {
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
