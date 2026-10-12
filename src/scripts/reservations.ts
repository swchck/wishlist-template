import { getSupabase } from "../lib/supabase";

type Unit = { slug: string; root: HTMLElement; btn: HTMLButtonElement | null };

function guestToken(): string {
  let t = localStorage.getItem("wl-token");
  if (!t) {
    t =
      (crypto.randomUUID?.() ?? String(Math.random()).slice(2)) +
      String(Date.now());
    localStorage.setItem("wl-token", t);
  }
  return t;
}

function loadMine(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem("wl-mine") || "[]"));
  } catch {
    return new Set();
  }
}
function saveMine(mine: Set<string>) {
  localStorage.setItem("wl-mine", JSON.stringify([...mine]));
}

export async function initReservations() {
  const units: Unit[] = Array.from(
    document.querySelectorAll<HTMLElement>("[data-item-slug]"),
  ).map((root) => ({
    slug: root.dataset.itemSlug!,
    root,
    btn: root.querySelector("[data-reserve-btn]"),
  }));
  if (!units.length) return;

  const bySlug = new Map<string, Unit[]>();
  for (const u of units) {
    const list = bySlug.get(u.slug) ?? [];
    list.push(u);
    bySlug.set(u.slug, list);
  }

  const mine = loadMine();
  const reservedState = new Map<string, boolean>();

  const render = (u: Unit) => {
    const reserved = reservedState.get(u.slug) ?? false;
    const isMine = reserved && mine.has(u.slug);
    u.root.classList.toggle("is-reserved", reserved);
    u.root.classList.toggle("is-mine", isMine);
    const stamp = u.root.querySelector(".stamp");
    if (stamp) stamp.textContent = isMine ? "Ваша бронь" : "Занято";
    if (!u.btn) return;
    u.btn.disabled = reserved && !isMine;
    u.btn.textContent = isMine
      ? "Снять мою бронь"
      : reserved
        ? "Занято"
        : "Забронировать";
  };

  const setAll = (slug: string, reserved: boolean) => {
    reservedState.set(slug, reserved);
    if (!reserved && mine.has(slug)) {
      mine.delete(slug);
      saveMine(mine);
    }
    bySlug.get(slug)?.forEach(render);
  };

  const supabase = await getSupabase();

  if (!supabase) {
    for (const u of units)
      if (u.btn) {
        u.btn.disabled = true;
        u.btn.textContent = "Бронирование недоступно";
        u.btn.title = "Не заданы ключи Supabase (PUBLIC_SUPABASE_*)";
      }
    return;
  }

  const refresh = async (slug: string) => {
    const { data, error } = await supabase
      .from("reservations")
      .select("reserved")
      .eq("slug", slug)
      .maybeSingle();
    if (!error) setAll(slug, Boolean(data?.reserved));
  };

  const { data, error } = await supabase
    .from("reservations")
    .select("slug, reserved")
    .eq("reserved", true);
  if (error) {
    console.warn("[reservations] не удалось загрузить статусы:", error.message);
  }
  const reservedSlugs = new Set((data ?? []).map((r) => r.slug));
  for (const slug of bySlug.keys()) setAll(slug, reservedSlugs.has(slug));

  supabase
    .channel("reservations-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "reservations" },
      (payload) => {
        const row = (payload.new ?? payload.old) as {
          slug: string;
          reserved: boolean;
        };
        if (row?.slug && bySlug.has(row.slug))
          setAll(row.slug, Boolean(row.reserved));
      },
    )
    .subscribe();

  for (const [slug, list] of bySlug) {
    for (const unit of list) {
      unit.btn?.addEventListener("click", async () => {
        const btn = unit.btn!;
        const title = unit.root.dataset.itemTitle || "этот подарок";
        const reserved = reservedState.get(slug) ?? false;
        const isMine = reserved && mine.has(slug);

        if (isMine) {
          if (
            !window.confirm(
              `Снять вашу бронь с «${title}»? Подарок снова станет свободным.`,
            )
          )
            return;
          btn.disabled = true;
          btn.textContent = "Снимаем…";
          const { data, error } = await supabase.rpc("unreserve_item", {
            item_slug: slug,
            tok: guestToken(),
          });
          if (error || !data?.success) {
            await refresh(slug);
            window.alert("Не удалось снять бронь. Возможно, её уже сняли.");
            return;
          }
          mine.delete(slug);
          saveMine(mine);
          setAll(slug, false);
          return;
        }

        if (reserved) return;

        if (
          !window.confirm(
            `Забронировать «${title}»?\n\nДругие гости увидят, что подарок занят. ` +
              "Снять бронь сможете здесь же — кнопкой «Снять мою бронь».",
          )
        )
          return;
        btn.disabled = true;
        btn.textContent = "Бронируем…";
        const { data, error } = await supabase.rpc("reserve_item", {
          item_slug: slug,
          tok: guestToken(),
        });
        if (error) {
          await refresh(slug);
          window.alert("Не получилось забронировать. Попробуйте ещё раз.");
          return;
        }
        if (data?.success) {
          mine.add(slug);
          saveMine(mine);
          setAll(slug, true);
        } else {
          setAll(slug, true);
          window.alert(
            "Увы, этот подарок только что забронировал кто-то другой.",
          );
        }
      });
    }
  }
}
