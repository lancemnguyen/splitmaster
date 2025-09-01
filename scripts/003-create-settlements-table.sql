CREATE TABLE settlements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  group_id uuid not null references groups(id) on delete cascade,
  from_member_id uuid not null references members(id) on delete cascade,
  to_member_id uuid not null references members(id) on delete cascade,
  amount numeric not null check (amount > 0)
);

-- alter table settlements enable row level security;

-- You may want to add RLS policies for the settlements table.
-- For example, allowing members of a group to view and create settlements.
-- create policy "Allow members to access settlements in their group"
-- on settlements for all
-- using ( group_id in (select group_id from members where user_id = auth.uid()) )
-- with check ( group_id in (select group_id from members where user_id = auth.uid()) );

