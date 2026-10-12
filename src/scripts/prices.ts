const SYMBOLS: Record<string, string> = { EUR: "€", RUB: "₽", USD: "$" };

function fmt(amount: number, cur: string): string {
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("ru-RU").format(Math.round(amount))} ${SYMBOLS[cur] ?? cur}`;
  }
}

export function initPrices() {
  const ratesEl = document.getElementById("rates");
  if (!ratesEl) return;
  let rates: Record<string, number> = {};
  try {
    rates = JSON.parse(ratesEl.textContent || "{}");
  } catch {
    return;
  }

  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-cur-set]"),
  );
  const get = () => localStorage.getItem("wl-cur") || "EUR";

  function render(cur: string) {
    document.querySelectorAll<HTMLElement>(".price-tag").forEach((tag) => {
      const conv = tag.querySelector<HTMLElement>("[data-conv]");
      if (!conv) return;
      const raw = tag.dataset.eur;
      const orig = (conv.dataset.curOrig || "").toUpperCase();
      const rate = rates[cur];
      const eur = Number(raw);
      if (
        raw === "" ||
        raw == null ||
        !Number.isFinite(eur) ||
        cur === orig ||
        !rate
      ) {
        conv.hidden = true;
        return;
      }
      conv.hidden = false;
      conv.textContent = `≈ ${fmt(eur * rate, cur)}`;
    });
    localStorage.setItem("wl-cur", cur);
    for (const b of buttons)
      b.setAttribute("aria-pressed", String(b.dataset.curSet === cur));
  }

  render(get());
  for (const b of buttons)
    b.addEventListener("click", () => render(b.dataset.curSet!));
}
