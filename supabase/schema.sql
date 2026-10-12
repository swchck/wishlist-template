create table if not exists public.reservations (
  slug        text primary key,
  reserved    boolean     not null default false,
  reserved_at timestamptz
);

create table if not exists public.reservation_secrets (
  slug       text primary key,
  token_hash text not null
);

alter table public.reservations enable row level security;
alter table public.reservation_secrets enable row level security;

drop policy if exists "read reservations" on public.reservations;
create policy "read reservations"
  on public.reservations for select to anon, authenticated using (true);

revoke select on public.reservations from anon, authenticated;
grant  select (slug, reserved) on public.reservations to anon, authenticated;

revoke all on public.reservation_secrets from anon, authenticated;

create or replace function public.reserve_item(item_slug text, tok text)
returns json language plpgsql security definer set search_path = public as $$
declare affected int;
begin
  insert into public.reservations (slug, reserved, reserved_at)
  values (item_slug, true, now())
  on conflict (slug) do update
    set reserved = true, reserved_at = now()
    where reservations.reserved = false;
  get diagnostics affected = row_count;

  if affected > 0 then
    insert into public.reservation_secrets (slug, token_hash)
    values (item_slug, md5(tok))
    on conflict (slug) do update set token_hash = md5(tok);
  end if;

  return json_build_object('success', affected > 0, 'slug', item_slug);
end; $$;

create or replace function public.unreserve_item(item_slug text, tok text)
returns json language plpgsql security definer set search_path = public as $$
declare affected int;
begin
  update public.reservations
    set reserved = false, reserved_at = null
    where slug = item_slug and reserved = true
      and exists (
        select 1 from public.reservation_secrets s
        where s.slug = item_slug and s.token_hash = md5(tok)
      );
  get diagnostics affected = row_count;

  if affected > 0 then
    delete from public.reservation_secrets where slug = item_slug;
  end if;

  return json_build_object('success', affected > 0, 'slug', item_slug);
end; $$;

revoke all on function public.reserve_item(text, text) from public;
revoke all on function public.unreserve_item(text, text) from public;
grant execute on function public.reserve_item(text, text) to anon, authenticated;
grant execute on function public.unreserve_item(text, text) to anon, authenticated;

alter publication supabase_realtime add table public.reservations;
