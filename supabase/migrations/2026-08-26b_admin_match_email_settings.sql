-- Le responsable certif / admin technique défini dans email_settings doit automatiquement
-- avoir les droits admin sur le portail quand il se connecte avec cette adresse, sans avoir
-- besoin d'être aussi un consultant avec is_admin = true.

create or replace function is_current_user_admin() returns boolean
language sql stable security definer
as $$
  select
    (select email from auth.users where id = auth.uid()) = 'etiennegaspard08@gmail.com'
    or (select email from auth.users where id = auth.uid()) in (
      select responsable_email from email_settings where id = 1
      union
      select admin_email from email_settings where id = 1
    )
    or exists (
      select 1 from consultants
      where email = (select email from auth.users where id = auth.uid())
      and is_admin = true
    );
$$;
