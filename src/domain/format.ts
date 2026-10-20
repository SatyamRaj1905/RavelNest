import { currencies, type Currency } from './contracts';

const moneyFormatters = new Map(
  currencies.map((currency) => [
    currency,
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }),
  ]),
);
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const DAY_MS = 86400000;

export function formatMoney(amount: number, currency: Currency): string {
  return moneyFormatters.get(currency)?.format(amount) ?? String(amount);
}

export function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

export function daysUntil(date: string, now: Date = new Date()): number {
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Math.ceil((new Date(`${date}T00:00:00Z`).getTime() - today) / DAY_MS);
}

export function offsetDate(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function getCountdown(
  date: string,
  now: Date = new Date(),
): { value: string; label: string } {
  const days = daysUntil(date, now);
  if (days === 0) return { value: 'TODAY', label: 'LET’S CELEBRATE' };
  if (days < 0)
    return {
      value: String(-days),
      label: days === -1 ? 'DAY AGO' : 'DAYS AGO',
    };
  return {
    value: String(days),
    label: days === 1 ? 'DAY TO GO' : 'DAYS TO GO',
  };
}
