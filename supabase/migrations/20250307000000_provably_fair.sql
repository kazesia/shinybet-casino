-- Enable pgcrypto for hashing
create extension if not exists "pgcrypto";

-- Create table for user seeds
create table if not exists public.user_seeds (
  user_id uuid primary key references auth.users(id) on delete cascade,
  client_seed text not null,
  server_seed text not null, -- Secret, never sent to client until rotated
  server_seed_hash text not null, -- Publicly visible
  nonce int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_seeds enable row level security;

-- Policy: Users can only see their own row (but we will use RPCs for safer field selection)
create policy "Users can view own seeds"
  on public.user_seeds for select
  using (auth.uid() = user_id);

-- Function: Get or Create Seeds (Safe Access)
-- Returns the hash, not the raw server seed
create or replace function public.get_user_seeds(p_user_id uuid)
returns table (client_seed text, server_seed_hash text, nonce int)
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_server_seed text;
  v_hash text;
begin
  -- Check if seeds exist
  if not exists (select 1 from public.user_seeds where user_id = p_user_id) then
    -- Generate initial seeds
    v_server_seed := encode(gen_random_bytes(32), 'hex');
    v_hash := encode(digest(v_server_seed, 'sha256'), 'hex');
    
    insert into public.user_seeds (user_id, client_seed, server_seed, server_seed_hash, nonce)
    values (p_user_id, encode(gen_random_bytes(10), 'hex'), v_server_seed, v_hash, 0);
  end if;

  return query
  select s.client_seed, s.server_seed_hash, s.nonce
  from public.user_seeds s
  where s.user_id = p_user_id;
end;
$$;

-- Function: Rotate Seed
-- Reveals the OLD server seed and generates a NEW pair
create or replace function public.rotate_seed(p_new_client_seed text)
returns table (previous_server_seed text, new_server_seed_hash text, new_nonce int)
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_old_server_seed text;
  v_new_server_seed text;
  v_new_hash text;
begin
  -- Get old seed to return it
  select server_seed into v_old_server_seed
  from public.user_seeds
  where user_id = v_user_id;

  -- Generate new server seed
  v_new_server_seed := encode(gen_random_bytes(32), 'hex');
  v_new_hash := encode(digest(v_new_server_seed, 'sha256'), 'hex');

  -- Update record
  update public.user_seeds
  set 
    server_seed = v_new_server_seed,
    server_seed_hash = v_new_hash,
    client_seed = p_new_client_seed,
    nonce = 0,
    updated_at = now()
  where user_id = v_user_id;

  -- If no record existed (shouldn't happen if get_user_seeds called first, but safety check)
  if not found then
     insert into public.user_seeds (user_id, client_seed, server_seed, server_seed_hash, nonce)
     values (v_user_id, p_new_client_seed, v_new_server_seed, v_new_hash, 0);
     v_old_server_seed := null;
  end if;

  return query select v_old_server_seed, v_new_hash, 0;
end;
$$;
