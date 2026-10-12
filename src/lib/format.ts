export function formatPrice(price?: number, currency = "RUB"): string {
  if (price == null) return "Цена не указана";
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${new Intl.NumberFormat("ru-RU").format(price)} ${currency}`;
  }
}

export function formatEur(price?: number): string {
  if (price == null) return "Цена не указана";
  const rounded = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(Math.round(price));
  return `≈ ${rounded} €`;
}

export function formatDeadline(date?: Date): string | undefined {
  if (!date) return undefined;
  return (
    "к " +
    new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(date)
  );
}

export function isoDate(date?: Date): string | undefined {
  if (!date) return undefined;
  return date.toISOString().slice(0, 10);
}

export const PRIORITY_LABELS: Record<number, string> = {
  1: "Очень хочу",
  2: "Хочу",
  3: "Было бы здорово",
  4: "Приятная мелочь",
  5: "На всякий случай",
};
