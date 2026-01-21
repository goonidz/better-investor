-- Subscriptions table for Stripe integration
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free' check (plan in ('free', 'deepdive')),
  status text default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies
alter table subscriptions enable row level security;

-- Users can read their own subscription
create policy "Users can read own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Only service role can insert/update (via webhooks)
create policy "Service role can manage subscriptions"
  on subscriptions for all
  using (auth.role() = 'service_role');

-- Create index for faster lookups
create index if not exists idx_subscriptions_user_id on subscriptions(user_id);
create index if not exists idx_subscriptions_stripe_customer_id on subscriptions(stripe_customer_id);

-- Function to auto-create subscription record for new users
create or replace function handle_new_user_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create subscription on user signup
drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute procedure handle_new_user_subscription();
