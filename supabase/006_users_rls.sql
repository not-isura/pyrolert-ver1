-- Helper function to get current user's role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- SELECT: own row always readable; admin can read all
CREATE POLICY "users_select" ON public.users
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR get_my_role() = 'admin');

-- INSERT: admin only
CREATE POLICY "users_insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'admin');

-- UPDATE: own row or admin
CREATE POLICY "users_update" ON public.users
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid() OR get_my_role() = 'admin')
  WITH CHECK (auth_user_id = auth.uid() OR get_my_role() = 'admin');

-- DELETE: admin only
CREATE POLICY "users_delete" ON public.users
  FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

ALTER TABLE public.users DROP COLUMN password;