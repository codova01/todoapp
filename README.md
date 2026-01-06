# Todo App (React + Vite)

Simple todo app built with React + Vite.

## Features
- Add, toggle, delete todos
- Filter (All / Active / Completed)
- Persisted to Supabase (optional localStorage fallback previously)

## Supabase integration

This project supports authentication and synced todos via Supabase.

1. Create a Supabase project at https://app.supabase.com and copy the project URL and anon key into a `.env.local` file using the `.env.example` as a template.

2. Create a `todos` table (SQL example):

```sql
create table todos (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  completed boolean default false,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
```

3. Ensure Row Level Security is enabled and add a policy so users can manage their own todos, for example:

```sql
-- allow authenticated users to insert
create policy "Allow authenticated inserts" on todos
  for insert
  with check (auth.uid() = user_id);

-- allow authenticated users to select
create policy "Allow authenticated select" on todos
  for select
  using (auth.uid() = user_id);

-- allow authenticated users to update/delete their own rows
create policy "Allow authenticated update/delete" on todos
  for update, delete
  using (auth.uid() = user_id);
```

4. Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 and use the email sign-in form to start syncing todos.
