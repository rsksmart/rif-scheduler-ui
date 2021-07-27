export const nothing = "";
// const convertCronStringToArray = (expression: string) => {
//     try {
//       return cronConverter.fromString(expression).toArray();
//     } catch {
//       return cronConverter.fromString(CRON_DEFAULT).toArray();
//     }
//   };

//   useEffect(() => {
//     // TODO: needs more work

//     const currentValue = value === "" ? CRON_DEFAULT : value;

//     const currentValueArray = convertCronStringToArray(currentValue);

//     const isDaily = currentValueArray[ECronArrayDefinition.Day].length === 31;

//     const time = tConvert(
//       currentValueArray[ECronArrayDefinition.Hour][0],
//       currentValueArray[ECronArrayDefinition.Minute][0]
//     );

//     console.log({
//       currentValueArray,
//       time,
//       isDaily,
//     });
//   }, [value]);

// function tConvert(hour: number, minute: number) {
//     return {
//       hour: hour % 12 || 12,
//       minute: minute,
//       midday: hour < 12 ? "AM" : "PM",
//     };
//   }
