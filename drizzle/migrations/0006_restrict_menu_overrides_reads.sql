DROP POLICY IF EXISTS "Public menu overrides" ON public.menu_overrides;
REVOKE SELECT ON public.menu_overrides FROM anon;
CREATE POLICY "Owners read menu overrides" ON public.menu_overrides FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'));