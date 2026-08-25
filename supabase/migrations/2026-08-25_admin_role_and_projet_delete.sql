alter table consultants add column if not exists is_admin boolean not null default false;

create or replace function is_current_user_admin() returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from consultants
    where email = (select email from auth.users where id = auth.uid())
    and is_admin = true
  );
$$;

drop policy if exists "ecriture auth projets" on projets;
create policy "insert auth projets" on projets for insert with check (auth.role() = 'authenticated');
create policy "update auth projets" on projets for update using (auth.role() = 'authenticated');
create policy "suppression admin projets" on projets for delete using (is_current_user_admin());

update consultants set is_admin = true
where email in ('etienne.gaspard@inetum.com', 'aidelma.borges-pereira@inetum.com');
