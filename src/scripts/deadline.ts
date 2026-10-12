function plural(n: number): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return "дней";
  if (b === 1) return "день";
  if (b >= 2 && b <= 4) return "дня";
  return "дней";
}

export function daysLeft(iso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

export function initDeadlines() {
  document.querySelectorAll<HTMLElement>("[data-deadline]").forEach((el) => {
    const iso = el.dataset.deadline;
    if (!iso) return;
    const n = daysLeft(iso);
    el.classList.toggle("is-urgent", n >= 0 && n <= 7);
    el.classList.toggle("is-past", n < 0);
    const note = el.querySelector<HTMLElement>("[data-days]");
    if (note) {
      note.textContent =
        n < 0
          ? "срок прошёл"
          : n === 0
            ? "сегодня"
            : n <= 30
              ? `осталось ${n} ${plural(n)}`
              : "";
    }
  });
}
