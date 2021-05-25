const secondsToHms = (secondsInput: number) => {
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

export default secondsToHms;
