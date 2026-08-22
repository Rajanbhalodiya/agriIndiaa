/**
 * Formats a given numeric price for display in Indian Rupees (₹).
 * If the price has decimals (e.g. 230.2 or 230.20), it will display 2 decimal places (230.20).
 * If it is a whole integer (e.g. 250), it will display without unnecessary decimals (250).
 */
export const formatPrice = (value) => {
  const num = Number(value);
  if (isNaN(num) || value === null || value === undefined) return '0';
  if (num % 1 !== 0) {
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return num.toLocaleString('en-IN');
};
