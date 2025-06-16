export function formatNumber(number: number | null = null) {
  if (number === null || isNaN(number)) return null;

  const formatter = new Intl.NumberFormat("en-CA", {
    minimumIntegerDigits: 2,
    maximumFractionDigits: 0,
  });

  return formatter.format(number);
}
