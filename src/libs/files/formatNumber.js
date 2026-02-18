export function formatNumber(number) {
  if (number === undefined || isNaN(number)) return;

  const formatter = new Intl.NumberFormat("en-CA", {
    minimumIntegerDigits: 2,
    maximumFractionDigits: 0,
  });

  return formatter.format(number);
}
