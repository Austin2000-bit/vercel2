-- Complete OTP System Debug Script

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  meta jsonb := NEW.raw_user_meta_data;
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(meta->>'first_name', ''),
    COALESCE(meta->>'last_name', ''),
    COALESCE(meta->>'role', 'student'),
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
