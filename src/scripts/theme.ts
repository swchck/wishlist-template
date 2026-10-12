type Mode = "light" | "dark" | "auto";

export function initTheme() {
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-theme-set]"),
  );
  if (!buttons.length) return;

  const get = (): Mode => (localStorage.getItem("theme") as Mode) || "auto";

  const apply = (mode: Mode) => {
    if (mode === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = mode;
    localStorage.setItem("theme", mode);
    for (const b of buttons)
      b.setAttribute("aria-pressed", String(b.dataset.themeSet === mode));
  };

  apply(get());
  for (const b of buttons)
    b.addEventListener("click", () => apply(b.dataset.themeSet as Mode));
}
