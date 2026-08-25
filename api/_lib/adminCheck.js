// Réplique côté serveur la logique de is_current_user_admin() (schema.sql) : appelée depuis
// une route API avec le client service-role, auth.uid() n'est pas disponible (pas de session),
// donc on refait le même test à partir de l'email déjà résolu via supabaseAdmin.auth.getUser().
export async function estAdmin(supabaseAdmin, email) {
  if (!email) return false
  if (email === 'etiennegaspard08@gmail.com') return true

  const { data: settings } = await supabaseAdmin.from('email_settings').select('responsable_email, admin_email').eq('id', 1).maybeSingle()
  if (settings && (email === settings.responsable_email || email === settings.admin_email)) return true

  const { data: consultant } = await supabaseAdmin.from('consultants').select('is_admin').eq('email', email).maybeSingle()
  return consultant?.is_admin === true
}
