-- Policies RLS sur storage.objects pour les buckets avatars/ressources.
-- Sans elles, l'upload échoue silencieusement (RLS bloque l'insert par défaut)
-- même si le bucket lui-même est marqué "public" (public = lecture seule).

create policy "lecture publique avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "ecriture auth avatars"
  on storage.objects for all
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "lecture publique ressources storage"
  on storage.objects for select
  using (bucket_id = 'ressources');

create policy "ecriture auth ressources storage"
  on storage.objects for all
  using (bucket_id = 'ressources' and auth.role() = 'authenticated');
