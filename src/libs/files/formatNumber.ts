const formatter = new Intl.NumberFormat("en-CA", {
  minimumIntegerDigits: 2,
  maximumFractionDigits: 0,
});

export function formatNumber(number: number): string | undefined {
  if (number === undefined || isNaN(number)) return undefined;
  return formatter.format(number);
}
