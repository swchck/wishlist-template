-- Reservations for one or many wishlists sharing a Supabase project.
-- Every row belongs to a list (the wishlist's `listId`, by default "owner/repo"),
-- so several sites can use the same URL and anon key without seeing each other's gifts.
--
-- Safe to run again: tables are created only once, functions and grants are replaced.
-- Upgrading a database created before lists existed: run migrations/002-shared-lists.sql first.

create table if not exists public.reservations (
  list        text        not null check (char_length(list) between 1 and 140),
  slug        text        not null check (char_length(slug) between 1 and 80),
  reserved    boolean     not null default false,
  reserved_at timestamptz,
  primary key (list, slug)
);

-- token hashes live apart so that the anon role can never select them
create table if not exists public.reservation_secrets (
  list       text not null,
  slug       text not null,
  token_hash text not null,
  primary key (list, slug)
);

alter table public.reservations enable row level security;
alter table public.reservation_secrets enable row level security;

drop policy if exists "read reservations" on public.reservations;
create policy "read reservations"
  on public.reservations for select to anon, authenticated using (true);

revoke select on public.reservations from anon, authenticated;
grant  select (list, slug, reserved) on public.reservations to anon, authenticated;

revoke all on public.reservation_secrets from anon, authenticated;

create or replace function public.reserve_item(list_id text, item_slug text, tok text)
returns json language plpgsql security definer set search_path = public as $$
declare affected int;
begin
  insert into public.reservations (list, slug, reserved, reserved_at)
  values (list_id, item_slug, true, now())
  on conflict (list, slug) do update
    set reserved = true, reserved_at = now()
    where reservations.reserved = false;
  get diagnostics affected = row_count;

  if affected > 0 then
    insert into public.reservation_secrets (list, slug, token_hash)
    values (list_id, item_slug, md5(tok))
    on conflict (list, slug) do update set token_hash = md5(tok);
  end if;

  return json_build_object('success', affected > 0, 'slug', item_slug);
end; $$;

create or replace function public.unreserve_item(list_id text, item_slug text, tok text)
returns json language plpgsql security definer set search_path = public as $$
declare affected int;
begin
  update public.reservations
    set reserved = false, reserved_at = null
    where list = list_id and slug = item_slug and reserved = true
      and exists (
        select 1 from public.reservation_secrets s
        where s.list = list_id and s.slug = item_slug and s.token_hash = md5(tok)
      );
  get diagnostics affected = row_count;

  if affected > 0 then
    delete from public.reservation_secrets where list = list_id and slug = item_slug;
  end if;

  return json_build_object('success', affected > 0, 'slug', item_slug);
end; $$;

revoke all on function public.reserve_item(text, text, text) from public;
revoke all on function public.unreserve_item(text, text, text) from public;
grant execute on function public.reserve_item(text, text, text) to anon, authenticated;
grant execute on function public.unreserve_item(text, text, text) to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reservations'
  ) then
    alter publication supabase_realtime add table public.reservations;
  end if;
end $$;
