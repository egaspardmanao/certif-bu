import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { isAuthorizedCron } from '../_lib/cronAuth.js'

// Voucher Attribué dont la date d'expiration (alignée sur la date prévisionnelle de la certification
// au moment de l'attribution) est dépassée → statut 'Utilisé'.
export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'Non autorisé' })

  const supabaseAdmin = getSupabaseAdmin()
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabaseAdmin
    .from('vouchers')
    .update({ statut: 'Utilisé' })
    .eq('statut', 'Attribué')
    .lt('date_expiration', today)
    .select('id')
  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ok: true, count: data?.length ?? 0 })
}
