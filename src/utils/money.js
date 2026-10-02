export const CURRENCIES = ['LKR', 'USD', 'EUR', 'GBP'];
export function integer(value) {
  if (!Number.isSafeInteger(value))
    throw new Error('Amount exceeds the supported safe integer range.');
  return value;
}
export function add(a, b) {
  return integer(a + b);
}
export function parseMoney(input) {
  const text = String(input).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text))
    throw new Error('Enter a positive amount with up to two decimal places.');
  const [whole, fraction = ''] = text.split('.');
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (amount > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error('Amount is too large.');
  return Number(amount);
}
export function toDecimal(value) {
  integer(value);
  const sign = value < 0 ? '-' : '';
  const n = Math.abs(value);
  return `${sign}${Math.floor(n / 100)}.${String(n % 100).padStart(2, '0')}`;
}
export function formatMoney(value, currency = 'LKR') {
  const [whole, fraction] = toDecimal(value).split('.');
  return `${currency === 'LKR' ? 'Rs.' : currency} ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
}
