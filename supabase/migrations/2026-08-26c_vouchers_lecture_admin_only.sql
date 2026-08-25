-- Les codes vouchers ne doivent jamais être visibles côté consultant (uniquement en Admin) :
-- la policy "lecture publique vouchers" (select using (true)) permettait à n'importe quel
-- utilisateur authentifié de lire tous les codes vouchers directement via le client Supabase,
-- même si l'UI ne les affichait pas. Restreint la lecture aux admins.

drop policy if exists "lecture publique vouchers" on vouchers;

create policy "lecture admin vouchers" on vouchers for select using (is_current_user_admin());
