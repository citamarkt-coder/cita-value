-- Cita Value – PostgreSQL Schema
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  user_id uuid primary key references users(id) on delete cascade,
  stripe_customer_id text unique
);

create table if not exists subscriptions (
  id text primary key, -- stripe subscription id
  user_id uuid references users(id) on delete cascade,
  status text,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('kurz','verkehr')),
  title text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  original_name text not null,
  mime_type text not null,
  path text not null,
  size bigint not null,
  tag text,
  note text,
  created_at timestamptz not null default now()
);
