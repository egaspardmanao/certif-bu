-- Autorise le compte Gmail personnel d'Etienne (auth) en admin,
-- en plus des consultants avec is_admin = true.
-- Le consultant "Etienne Gaspard" garde son email pro (etienne.gaspard@inetum.com),
-- seul le compte d'authentification Supabase diffère.

create or replace function is_current_user_admin() returns boolean
language sql stable security definer
as $$
  select
    (select email from auth.users where id = auth.uid()) = 'etiennegaspard08@gmail.com'
    or exists (
      select 1 from consultants
      where email = (select email from auth.users where id = auth.uid())
      and is_admin = true
    );
$$;
