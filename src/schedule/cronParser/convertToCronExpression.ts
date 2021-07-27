import {
  ECronArrayDefinition,
  ECronFieldOption,
  EMidday,
  EMonths,
  EWeekDay,
} from "./enums";
import cronstrue from "cronstrue";
import Cron from "cron-converter";
import { MONTHS_LIST, WEEK_LIST } from "./descriptions";
const cronConverter = new Cron();

export interface ICronField {
  option: ECronFieldOption;
  every: number;
  hour: number;
  minute: number;
  midday: EMidday;
  weekDays: EWeekDay[];
  months: EMonths[];
  monthDays: number[];
  expression: string;
  description: string;
}

const CRON_DEFAULT = "0 0 */1 * *";

export const DEFAULT_CRON_FIELD: ICronField = {
  option: ECronFieldOption.Day,
  every: 1,
  hour: 12,
  minute: 0,
  midday: EMidday.AM,
  weekDays: [EWeekDay.Monday],
  months: [EMonths.January],
  monthDays: [1],
  expression: CRON_DEFAULT,
  description: cronstrue.toString(CRON_DEFAULT, { verbose: true }),
};

export const convertToCronExpression = (field: ICronField) => {
  let expression = field.expression;

  if (field.option !== ECronFieldOption.Custom) {
    let currentValueArray: Cron.CronArray = [[], [], [], [], []];

    if (field.midday === EMidday.AM)
      currentValueArray[ECronArrayDefinition.Hour][0] =
        field.hour === 12 ? 0 : field.hour;

    if (field.midday === EMidday.PM)
      currentValueArray[ECronArrayDefinition.Hour][0] =
        field.hour === 12 ? 12 : field.hour + 12;

    currentValueArray[ECronArrayDefinition.Minute][0] = field.minute;

    if (field.option === ECronFieldOption.Day) {
      currentValueArray[ECronArrayDefinition.Day] = arrayFromWithStep(
        Array.from(Array(31).keys()).map((x) => x + 1),
        field.every
      );

      currentValueArray[ECronArrayDefinition.Month] = MONTHS_LIST.map(
        (x) => x + 1
      );

      currentValueArray[ECronArrayDefinition.DayWeek] = WEEK_LIST;
    } else if (field.option === ECronFieldOption.Week) {
      const weeksRepetitionStart = arrayFromWithStep(
        Array.from(Array(31).keys()).map((x) => x + 1),
        field.every * 7
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

      currentValueArray[ECronArrayDefinition.DayWeek] = field.weekDays;
    } else if (field.option === ECronFieldOption.Month) {
      currentValueArray[ECronArrayDefinition.Day] = field.monthDays;

      currentValueArray[ECronArrayDefinition.Month] = arrayFromWithStep(
        MONTHS_LIST.map((x) => x + 1),
        field.every
      );

      currentValueArray[ECronArrayDefinition.DayWeek] = WEEK_LIST;
    } else if (field.option === ECronFieldOption.Year) {
      currentValueArray[ECronArrayDefinition.Day] = field.monthDays;

      currentValueArray[ECronArrayDefinition.Month] = field.months.map(
        (x) => x + 1
      );

      currentValueArray[ECronArrayDefinition.DayWeek] = WEEK_LIST;
    }

    expression = cronConverter.fromArray(currentValueArray).toString();
  }

  return {
    expression,
    description: cronstrue.toString(expression, { verbose: true }),
  };
};

function arrayFromWithStep(array: number[], step: number) {
  const result: number[] = [];
  for (let index = 0; index < array.length; index += step) {
    result.push(array[index]);
  }

  return result;
}
