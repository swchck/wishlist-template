import * as p from "@clack/prompts";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ITEMS_DIR = "src/content/items";
const { defaultCurrency = "RUB" } = JSON.parse(readFileSync("wishlist.config.json", "utf-8"));

const MAP = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};
function slugify(s) {
  return s
    .toLowerCase()
    .split("")
    .map((c) => (c in MAP ? MAP[c] : c))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function guard(value) {
  if (p.isCancel(value)) {
    p.cancel("Отменено — файл не создан.");
    process.exit(0);
  }
  return value;
}

const httpOk = (v) =>
  v && !/^https?:\/\//.test(v.trim())
    ? "Ссылка должна начинаться с http(s)://"
    : undefined;
const y = (v) => JSON.stringify(String(v));

p.intro("🎁  Новая карточка вишлиста");

const title = guard(
  await p.text({
    message: "Название подарка",
    placeholder: "Наушники Sony WH-1000XM5",
    validate: (v) => (!v || !v.trim() ? "Без названия никак" : undefined),
  }),
);

const type = guard(
  await p.select({
    message: "Тип подарка",
    options: [
      { value: "вещь", label: "Вещь", hint: "товар, гаджет, книга…" },
      {
        value: "впечатление",
        label: "Впечатление",
        hint: "прыжок, ужин, поездка",
      },
      { value: "навык", label: "Навык", hint: "курс, обучение, права" },
      {
        value: "услуга",
        label: "Услуга",
        hint: "сертификат, подписка, сервис",
      },
      { value: "другое", label: "Другое" },
    ],
    initialValue: "вещь",
  }),
);

const kind = guard(
  await p.select({
    message: "Насколько это конкретно?",
    options: [
      {
        value: "concrete",
        label: "Конкретный товар",
        hint: "знаю модель — будет ссылка и цена",
      },
      {
        value: "abstract",
        label: "Примерное пожелание",
        hint: "опишу словами, дам референс",
      },
    ],
    initialValue: "concrete",
  }),
);

const category = guard(
  await p.text({
    message: "Категория (Enter — пропустить)",
    placeholder: "Электроника, Кухня, Море…",
  }),
);

const priority = guard(
  await p.select({
    message: "Насколько хочешь?",
    options: [
      { value: 1, label: "Очень хочу" },
      { value: 2, label: "Хочу" },
      { value: 3, label: "Было бы здорово" },
      { value: 4, label: "Приятная мелочь" },
      { value: 5, label: "На всякий случай" },
    ],
    initialValue: 3,
  }),
);

let price = null;
let currency = defaultCurrency;
const wantPrice =
  kind === "concrete"
    ? true
    : guard(await p.confirm({ message: "Указать цену?", initialValue: false }));

if (wantPrice) {
  const currencyOptions = [
    { value: "RUB", label: "₽  Рубли" },
    { value: "EUR", label: "€  Евро" },
    { value: "USD", label: "$  Доллары" },
    { value: "RSD", label: "дин.  Сербский динар" },
    { value: "GBP", label: "£  Фунты" },
  ];
  if (!currencyOptions.some((o) => o.value === defaultCurrency)) {
    currencyOptions.unshift({ value: defaultCurrency, label: defaultCurrency });
  }
  currency = guard(
    await p.select({
      message: "Валюта",
      options: [
        ...currencyOptions,
        { value: "__other", label: "Другая (ввести код)" },
      ],
      initialValue: defaultCurrency,
    }),
  );
  if (currency === "__other") {
    currency = guard(
      await p.text({
        message: "Код валюты (ISO), напр. PLN",
        validate: (v) => (!v ? "Введите код" : undefined),
      }),
    )
      .trim()
      .toUpperCase();
  }
  const priceStr = guard(
    await p.text({
      message: `Цена в ${currency} (только число)`,
      validate: (v) =>
        v && isNaN(Number(v.replace(/\s/g, ""))) ? "Нужно число" : undefined,
    }),
  );
  price = priceStr ? Number(priceStr.replace(/\s/g, "")) : null;
}

let url = "";
let refUrl = "";
if (kind === "concrete") {
  url = guard(
    await p.text({
      message: "Ссылка на товар (магазин)",
      placeholder: "https://…",
      validate: httpOk,
    }),
  ).trim();
} else {
  refUrl = guard(
    await p.text({
      message: "Ссылка-референс (Enter — пропустить)",
      placeholder: "https://… пример того, что хочешь",
      validate: httpOk,
    }),
  ).trim();
}

let deadline = "";
if (
  guard(
    await p.confirm({
      message: "Есть желаемый срок (напр. ко дню рождения)?",
      initialValue: false,
    }),
  )
) {
  deadline = guard(
    await p.text({
      message: "Дата в формате ГГГГ-ММ-ДД",
      placeholder: "2026-08-12",
      validate: (v) =>
        !/^\d{4}-\d{2}-\d{2}$/.test(v || "") ? "Формат: 2026-08-12" : undefined,
    }),
  ).trim();
}

const imagesRaw = guard(
  await p.text({
    message: "Картинки (Enter — пропустить; несколько — через запятую)",
    placeholder: "https://…, https://…  (первая = обложка в списке)",
    validate: (v) => {
      if (!v || !v.trim()) return undefined;
      const bad = v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .find((u) => !/^https?:\/\//.test(u));
      return bad ? `Не похоже на ссылку: ${bad}` : undefined;
    },
  }),
).trim();
const images = imagesRaw
  ? imagesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : [];

const description = guard(
  await p.text({
    message: "Короткое описание (Enter — пропустить)",
    placeholder: "Пара слов для карточки",
  }),
).trim();

let slug = guard(
  await p.text({
    message: "Имя файла (slug)",
    initialValue: slugify(title),
    validate: (v) =>
      !/^[a-z0-9-]+$/.test(v || "")
        ? "Только латиница, цифры и дефис"
        : undefined,
  }),
).trim();

if (!existsSync(ITEMS_DIR)) mkdirSync(ITEMS_DIR, { recursive: true });
const file = join(ITEMS_DIR, `${slug}.md`);
if (existsSync(file)) {
  const ok = guard(
    await p.confirm({
      message: `Файл ${slug}.md уже есть. Перезаписать?`,
      initialValue: false,
    }),
  );
  if (!ok) {
    p.cancel("Отменено — файл не тронут.");
    process.exit(0);
  }
}

const fm = ["---", `title: ${y(title)}`, `type: ${type}`];
if (category) fm.push(`category: ${y(category)}`);
if (price != null) {
  fm.push(`price: ${price}`);
  fm.push(`currency: ${currency}`);
}
fm.push(`priority: ${priority}`);
if (deadline) fm.push(`deadline: ${deadline}`);
if (url) fm.push(`url: ${url}`);
if (refUrl)
  fm.push(
    "links:",
    `  - label: ${y("Референс — примерно так")}`,
    `    url: ${refUrl}`,
  );
if (images.length === 1) {
  fm.push(`image: ${images[0]}`);
} else if (images.length > 1) {
  fm.push("images:");
  for (const u of images) fm.push(`  - ${u}`);
}
if (description) fm.push(`description: ${y(description)}`);
fm.push("---", "");

writeFileSync(file, fm.join("\n") + "\n", "utf-8");

p.note(`${file}`, "Карточка создана");
p.outro(
  images.length
    ? `Готово! Картинок: ${images.length}${images.length > 1 ? " — на странице подарка будут листаться галереей" : ""}. Запусти \`npm run dev\` и проверь.`
    : "Готово! Картинку не задал — добавь `image:`/`images:` позже или оставь ✳-плейсхолдер. Затем `npm run dev`.",
);
