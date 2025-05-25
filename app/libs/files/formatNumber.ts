export function formatNumber(number: number | null = 0) {
  if (number === null) return "00";

  const formatter = new Intl.NumberFormat("en-CA", {
    minimumIntegerDigits: 2,
    maximumFractionDigits: 0,
  });

  return formatter.format(number);
}