-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create chat_messages table
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  username text not null,
  message text not null check (char_length(message) <= 160),
  country text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.chat_messages enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Public read" on public.chat_messages;
drop policy if exists "Users can insert" on public.chat_messages;

-- Create policies
create policy "Public read"
on public.chat_messages for select using (true);

create policy "Users can insert"
on public.chat_messages for insert
with check (auth.uid() = user_id);

-- Enable realtime for the table
-- This is the critical part for realtime to work!
alter publication supabase_realtime add table public.chat_messages;
