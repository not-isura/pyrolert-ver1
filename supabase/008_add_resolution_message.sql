ALTER TABLE public.alert_episodes
  ADD COLUMN IF NOT EXISTS resolution_message text null;
