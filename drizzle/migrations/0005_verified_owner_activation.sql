CREATE OR REPLACE FUNCTION public.activate_designated_owner() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.email_confirmed_at IS NOT NULL AND EXISTS (SELECT 1 FROM public.app_settings WHERE id=1 AND lower(btrim(owner_email))=lower(NEW.email)) THEN
  INSERT INTO public.profiles(id,email,full_name) VALUES(NEW.id,NEW.email,'Madhav Sharma') ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'owner') ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.activate_designated_owner() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER activate_designated_owner AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.activate_designated_owner();