-- Upgrades a reservations database created before lists existed.
--
-- 1. Put the listId of the wishlist that already uses this database into `legacy`
--    below (wishlist.config.json → listId, e.g. 'swchck/wishlist'). Its existing
--    reservations move to that list.
-- 2. Run this file, then run ../schema.sql to install the list-aware functions.
--
-- The old site's reserve buttons fail between this script and the site redeploy,
-- so run it right before the new site goes out. The block is atomic: on any error
-- nothing changes.

do $$
declare
  legacy constant text := 'OWNER/REPO';
begin
  if legacy = 'OWNER' || '/REPO' then
    raise exception 'set legacy to your wishlist id (e.g. swchck/wishlist) before running';
  end if;

  alter table public.reservations add column if not exists list text;
  alter table public.reservation_secrets add column if not exists list text;

  update public.reservations set list = legacy where list is null;
  update public.reservation_secrets set list = legacy where list is null;

  alter table public.reservations alter column list set not null;
  alter table public.reservation_secrets alter column list set not null;

  alter table public.reservations drop constraint if exists reservations_pkey;
  alter table public.reservations add primary key (list, slug);
  alter table public.reservation_secrets drop constraint if exists reservation_secrets_pkey;
  alter table public.reservation_secrets add primary key (list, slug);

  alter table public.reservations
    add constraint reservations_list_len check (char_length(list) between 1 and 140),
    add constraint reservations_slug_len check (char_length(slug) between 1 and 80);

  drop function if exists public.reserve_item(text, text);
  drop function if exists public.unreserve_item(text, text);
end $$;
