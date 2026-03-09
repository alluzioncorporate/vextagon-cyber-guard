
ALTER TABLE public.server_monitoring 
  ADD COLUMN IF NOT EXISTS modules jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS extra_data jsonb DEFAULT '{}'::jsonb;
