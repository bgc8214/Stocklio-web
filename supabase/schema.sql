create table if not exists public.portfolio_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portfolio_states enable row level security;

drop policy if exists "Users can read own portfolio state" on public.portfolio_states;
create policy "Users can read own portfolio state"
  on public.portfolio_states
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own portfolio state" on public.portfolio_states;
create policy "Users can insert own portfolio state"
  on public.portfolio_states
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own portfolio state" on public.portfolio_states;
create policy "Users can update own portfolio state"
  on public.portfolio_states
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists portfolio_states_set_updated_at on public.portfolio_states;
create trigger portfolio_states_set_updated_at
  before update on public.portfolio_states
  for each row
  execute function public.set_updated_at();
