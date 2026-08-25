drop policy if exists "ecriture auth vouchers" on vouchers;
drop policy if exists "ecriture auth email_settings" on email_settings;
drop policy if exists "no ecriture nom certifications" on nom_certifications;

create policy "ecriture admin email_settings"     on email_settings     for all using (is_current_user_admin());
create policy "ecriture admin vouchers"           on vouchers           for all using (is_current_user_admin());
create policy "ecriture admin nom_certifications" on nom_certifications for all using (is_current_user_admin());
