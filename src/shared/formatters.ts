import { BigNumber as EthBigNumber } from "@ethersproject/bignumber";
import BigNumber from "bignumber.js";

export const fromNumberToHms = (secondsInput: number) => {
  const days = Math.floor(secondsInput / (60 * 60 * 24));

  const divisor_for_hours = secondsInput % (60 * 60 * 24);

  const hours = Math.floor(divisor_for_hours / (60 * 60));

  const divisor_for_minutes = divisor_for_hours % (60 * 60);
  const minutes = Math.floor(divisor_for_minutes / 60);

  const divisor_for_seconds = divisor_for_minutes % 60;
  const seconds = Math.ceil(divisor_for_seconds);

  let result = "";
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (seconds > 0) result += `${seconds}s `;

  return result.trim();
};

export const fromBigNumberToHms = (secondsInput: EthBigNumber) => {
  const days = secondsInput.div(60 * 60 * 24);

  const divisor_for_hours = secondsInput.mod(60 * 60 * 24);

  const hours = divisor_for_hours.div(60 * 60);

  const divisor_for_minutes = divisor_for_hours.mod(60 * 60);
  const minutes = divisor_for_minutes.div(60);

  const divisor_for_seconds = divisor_for_minutes.mod(60);
  const seconds = divisor_for_seconds;

  let result = "";
  if (days.gt(0)) result += `${days.toBigInt().toString()}d `;
  if (hours.gt(0)) result += `${hours.toBigInt().toString()}h `;
  if (minutes.gt(0)) result += `${minutes.toBigInt().toString()}m `;
  if (seconds.gt(0)) result += `${seconds.toBigInt().toString()}s `;

  return result.trim();
};

export const formatPrice = (price: EthBigNumber, decimals: number) => {
  const bigNumber = new BigNumber(price.toString()).div(10 ** decimals);

  if (bigNumber.decimalPlaces() > 0) {
    return bigNumber.toFormat(5);
  }

  return bigNumber.toFormat();
};
