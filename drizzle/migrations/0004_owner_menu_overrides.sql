CREATE TABLE public.menu_overrides (item_id text PRIMARY KEY, available boolean NOT NULL DEFAULT true, prices jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.menu_overrides TO anon, authenticated;
GRANT ALL ON public.menu_overrides TO service_role;
ALTER TABLE public.menu_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public menu overrides" ON public.menu_overrides FOR SELECT TO anon, authenticated USING (true);