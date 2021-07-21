import cronParser from "cron-parser";
import { parseISO } from "date-fns";

const getDatesFromCronExpression = (
  startAtISO: string,
  cronExpression: string,
  cronQuantity: number
) => {
  const options = {
    currentDate: parseISO(startAtISO),
    iterator: true,
  };
  const interval = cronParser.parseExpression(cronExpression, options);
  const requestedISODates: string[] = [];

  let next = startAtISO; // first execution

  for (let i = 0; i < cronQuantity; i++) {
    requestedISODates.push(next);

    const nextDate: any = interval.next();
    next = nextDate.value.toDate().toISOString();
  }

  return requestedISODates;
};

export default getDatesFromCronExpression;
