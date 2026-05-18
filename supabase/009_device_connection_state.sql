create table if not exists public.device_connection_state (
  id int primary key default 1,
  is_connected boolean not null default true,
  last_disconnected_at timestamptz,
  last_alert_sent_at timestamptz,
  constraint single_row check (id = 1)
);

insert into public.device_connection_state (id, is_connected)
values (1, true)
on conflict (id) do nothing;
