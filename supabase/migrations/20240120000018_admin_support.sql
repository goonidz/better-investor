-- Admin users table
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  role text default 'admin' check (role in ('admin', 'super_admin')),
  created_at timestamptz default now()
);

-- Support conversations
create table if not exists support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  status text default 'open' check (status in ('open', 'closed', 'pending')),
  subject text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Support messages
create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references support_conversations(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete set null,
  sender_type text not null check (sender_type in ('user', 'admin')),
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_support_conversations_user on support_conversations(user_id);
create index if not exists idx_support_conversations_status on support_conversations(status);
create index if not exists idx_support_messages_conversation on support_messages(conversation_id);
create index if not exists idx_support_messages_created on support_messages(created_at desc);

-- RLS policies
alter table admin_users enable row level security;
alter table support_conversations enable row level security;
alter table support_messages enable row level security;

-- Admin users: only admins can read
create policy "Admins can read admin_users"
  on admin_users for select
  using (auth.uid() in (select user_id from admin_users));

-- Support conversations: users see their own, admins see all
create policy "Users can read own conversations"
  on support_conversations for select
  using (auth.uid() = user_id);

create policy "Users can create conversations"
  on support_conversations for insert
  with check (auth.uid() = user_id);

create policy "Admins can read all conversations"
  on support_conversations for select
  using (auth.uid() in (select user_id from admin_users));

create policy "Admins can update conversations"
  on support_conversations for update
  using (auth.uid() in (select user_id from admin_users));

-- Support messages: users see messages in their conversations, admins see all
create policy "Users can read messages in own conversations"
  on support_messages for select
  using (
    conversation_id in (
      select id from support_conversations where user_id = auth.uid()
    )
  );

create policy "Users can send messages"
  on support_messages for insert
  with check (
    sender_type = 'user' 
    and sender_id = auth.uid()
    and conversation_id in (
      select id from support_conversations where user_id = auth.uid()
    )
  );

create policy "Admins can read all messages"
  on support_messages for select
  using (auth.uid() in (select user_id from admin_users));

create policy "Admins can send messages"
  on support_messages for insert
  with check (
    sender_type = 'admin'
    and auth.uid() in (select user_id from admin_users)
  );

create policy "Admins can update messages"
  on support_messages for update
  using (auth.uid() in (select user_id from admin_users));

-- Enable realtime for support messages
alter publication supabase_realtime add table support_messages;
alter publication supabase_realtime add table support_conversations;

-- Function to update conversation updated_at
create or replace function update_conversation_timestamp()
returns trigger as $$
begin
  update support_conversations 
  set updated_at = now() 
  where id = NEW.conversation_id;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_support_message_insert
  after insert on support_messages
  for each row execute function update_conversation_timestamp();
