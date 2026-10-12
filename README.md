# Вишлист

Шаблон сайта-вишлиста на [Astro](https://astro.build) с публикацией на GitHub Pages.
Каждый подарок — отдельная страница с ценой, категорией и ссылкой на магазин.
Список фильтруется и сортируется, а гости могут **забронировать** подарок в один
клик — статус «занято» тут же видят остальные.

## Как начать

**Через Wishlist Editor** (без терминала). Скачайте приложение со страницы
[релизов](https://github.com/swchck/wishlist-editor/releases), войдите через GitHub
и выберите «Создать новый вишлист». Приложение само создаст копию этого шаблона,
включит Pages и дождётся первой публикации.

**Вручную:**

1. **Use this template → Create a new repository**. Репозиторий должен быть публичным:
   на бесплатном тарифе Pages работает только для публичных.
2. **Settings → Pages → Source → GitHub Actions**.
3. **Actions → Deploy to GitHub Pages → Run workflow**.

Сайт появится на `https://<username>.github.io/<repo>`. Для репозитория с именем
`<username>.github.io` — прямо на `https://<username>.github.io`.

## Настройки — `wishlist.config.json`

```json
{
  "schemaVersion": 1,
  "title": "Мой вишлист",
  "defaultCurrency": "RUB"
}
```

- `title` — заголовок главной страницы.
- `defaultCurrency` — валюта карточки, если `currency` не указан.
- `listId` — необязательно: под каким именем вишлист хранит брони в Supabase. По умолчанию
  `owner/repo`; задайте явно, чтобы брони пережили переименование репозитория.
- `schemaVersion` — версия формата карточек. По ней Wishlist Editor понимает, что умеет
  редактировать этот репозиторий. Не меняйте вручную.

### Свой домен

В **Settings → Secrets and variables → Actions → Variables** задайте `SITE`
(напр. `https://wish.example.com`) и `BASE_PATH` (`/`).

## Карточки

Шаблон содержит две карточки-примера в `src/content/items/` — удалите их и добавьте свои.
Каждая карточка — файл `src/content/items/<slug>.md`:

```markdown
---
title: Название подарка
type: вещь # вещь | впечатление | навык | услуга | другое (фильтр)
category: Электроника # свободный тег внутри типа, необязательно
price: 4990 # необязательно (для свободного подарка можно опустить)
currency: RUB # RUB | USD | EUR | … — приводится к евро на сайте
priority: 2 # 1 (очень хочу) … 5 — метр «хочу» + сортировка
deadline: 2026-08-12 # необязательно — желательный срок (напр. ко дню рождения)
url: https://… # ссылка на покупку (у свободного подарка её нет)
links: # доп. ссылки: референсы, альтернативы, обзоры
  - label: Альтернатива — другая модель
    url: https://…
image: https://… # URL картинки ИЛИ локальный файл: ./images/<slug>-1.webp
images: # ИЛИ несколько фото (галерея с превью)
  - https://…
  - ./images/<slug>-2.webp
hidden: false # true — временно спрятать
description: Короткое описание для карточки.
---

Произвольный текст в теле — покажется на странице подарка (напр. альтернативы,
пожелания по цвету/размеру и т.п.).
```

**Свободный подарок** (без конкретной ссылки на покупку) — не указывайте `url` и `price`,
опишите желаемое в теле. Пример — `src/content/items/master-class.md`.

Из терминала карточку можно создать интерактивно: `npm run new`.

## Брони (необязательно)

Без настройки сайт работает, только кнопка «Забронировать» неактивна.

1. Создайте бесплатный проект на [supabase.com](https://supabase.com).
2. **SQL Editor** → выполните `supabase/schema.sql`.
3. **Project Settings → API**: скопируйте Project URL и publishable (anon) key.
4. В репозитории **Settings → Secrets and variables → Actions → New repository secret**:
   `PUBLIC_SUPABASE_URL` и `PUBLIC_SUPABASE_ANON_KEY`.
5. Перезапустите деплой.

**Одна база на несколько вишлистов.** Вишлист партнёра или друга может пользоваться вашим
проектом Supabase — достаточно тех же двух секретов. Брони каждого хранятся под его
`listId` и друг другу не мешают. Ключ и так публичный: данные защищают функции и политики
из `schema.sql`.

Вместо секретов URL и ключ можно вписать прямо в `wishlist.config.json` — так их проще
передать: Wishlist Editor при создании вишлиста сделает это сам.

```json
"reservations": { "url": "https://xxxx.supabase.co", "anonKey": "sb_publishable_…" }
```

Секреты `PUBLIC_SUPABASE_*`, если заданы, важнее конфига.

**База создана до появления `listId`?** Впишите в `legacy` в
`supabase/migrations/002-shared-lists.sql` `listId` вишлиста, который ею уже пользуется,
выполните файл, затем `supabase/schema.sql`, и сразу задеплойте сайт.

Гость, забронировавший подарок, видит на нём кнопку **«Снять мою бронь»** (у остальных —
просто «Занято»). У гостя в браузере хранится случайный токен, в БД лежит только его хэш,
поэтому снять бронь может лишь тот, кто её поставил.

Снять бронь вручную, если гость потерял токен:

```sql
-- снять бронь
update public.reservations set reserved = false, reserved_at = null
  where list = '<listId>' and slug = '<slug>';
delete from public.reservation_secrets where list = '<listId>' and slug = '<slug>';
-- посмотреть занятое
select slug, reserved_at from public.reservations
  where list = '<listId>' and reserved order by reserved_at;
-- сбросить всё после праздника (только этот вишлист)
update public.reservations set reserved = false, reserved_at = null where list = '<listId>';
delete from public.reservation_secrets where list = '<listId>';
```

## Аналитика (Яндекс.Метрика)

Необязательно. Создайте счётчик на [metrika.yandex.ru](https://metrika.yandex.ru) и задайте
его номер в **Settings → Secrets and variables → Actions → Variables** → `PUBLIC_YM_ID`
(локально — в `.env`). Без переменной счётчик не подключается.

## Локальный запуск

```bash
npm install
cp .env.example .env
npm run dev
```
