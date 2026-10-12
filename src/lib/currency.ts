const FALLBACK_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  RUB: 98,
  GBP: 0.85,
  JPY: 168,
  CNY: 7.8,
  KZT: 505,
  UAH: 45,
  TRY: 37,
  PLN: 4.3,
  CHF: 0.94,
  RSD: 117,
};

let cache: Promise<Record<string, number>> | null = null;

export function getRates(): Promise<Record<string, number>> {
  if (cache) return cache;
  cache = (async () => {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/EUR", {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        result?: string;
        rates?: Record<string, number>;
      };
      if (json.result !== "success" || !json.rates)
        throw new Error("bad payload");
      const rates = { ...FALLBACK_RATES, ...json.rates, EUR: 1 };
      console.log("[currency] загружены актуальные курсы (open.er-api.com)");
      return rates;
    } catch (e) {
      console.warn(
        "[currency] не удалось получить курсы, использую фолбэк:",
        (e as Error).message,
      );
      return FALLBACK_RATES;
    }
  })();
  return cache;
}

export function toEur(
  amount: number | undefined,
  currency: string,
  rates: Record<string, number>,
): number | undefined {
  if (amount == null) return undefined;
  const rate = rates[currency.toUpperCase()];
  if (!rate) return undefined;
  return amount / rate;
}
