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
set search_path = public
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

create table if not exists public.automation_runs (
  id uuid primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('running', 'success', 'partial', 'failed')),
  scope text not null,
  processed_portfolios integer not null default 0,
  success_count integer not null default 0,
  failure_count integer not null default 0,
  message text,
  created_at timestamptz not null default now()
);

alter table public.automation_runs enable row level security;

drop policy if exists "Users can read automation runs" on public.automation_runs;
create policy "Users can read automation runs"
  on public.automation_runs
  for select
  using (auth.role() = 'authenticated');

create table if not exists public.price_logs (
  id bigint generated always as identity primary key,
  portfolio_user_id uuid references auth.users(id) on delete cascade,
  automation_run_id uuid references public.automation_runs(id) on delete set null,
  symbol text not null,
  status text not null check (status in ('success', 'error')),
  price numeric,
  source text,
  as_of timestamptz not null default now(),
  message text,
  created_at timestamptz not null default now()
);

alter table public.price_logs enable row level security;

drop policy if exists "Users can read own price logs" on public.price_logs;
create policy "Users can read own price logs"
  on public.price_logs
  for select
  using (auth.uid() = portfolio_user_id);

create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'telegram' check (provider in ('telegram')),
  telegram_chat_id text,
  telegram_enabled boolean not null default false,
  daily_digest_enabled boolean not null default true,
  large_move_threshold_krw numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

drop policy if exists "Users can read own notification settings" on public.notification_settings;
create policy "Users can read own notification settings"
  on public.notification_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own notification settings" on public.notification_settings;
create policy "Users can insert own notification settings"
  on public.notification_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notification settings" on public.notification_settings;
create policy "Users can update own notification settings"
  on public.notification_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists notification_settings_set_updated_at on public.notification_settings;
create trigger notification_settings_set_updated_at
  before update on public.notification_settings
  for each row
  execute function public.set_updated_at();

create table if not exists public.notification_delivery_logs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null default 'telegram',
  message_type text not null default 'daily_digest',
  snapshot_date date,
  status text not null check (status in ('success', 'error', 'skipped')),
  message_preview text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notification_delivery_logs enable row level security;

drop policy if exists "Users can read own notification logs" on public.notification_delivery_logs;
create policy "Users can read own notification logs"
  on public.notification_delivery_logs
  for select
  using (auth.uid() = user_id);
