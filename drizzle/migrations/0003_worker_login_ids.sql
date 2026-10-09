ALTER TABLE public.profiles ADD COLUMN login_id text;
CREATE UNIQUE INDEX profiles_login_id_unique ON public.profiles (lower(login_id)) WHERE login_id IS NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_login_id_format CHECK (login_id IS NULL OR login_id ~ '^[a-z0-9][a-z0-9_-]{2,39}$');