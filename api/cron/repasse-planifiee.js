import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { isAuthorizedCron } from '../_lib/cronAuth.js'

// Certification À retenter dont la date prévisionnelle a été repoussée dans le futur → repasse Planifiée.
export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'Non autorisé' })

  const supabaseAdmin = getSupabaseAdmin()
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabaseAdmin
    .from('certifications')
    .update({ statut: 'Planifiée' })
    .eq('statut', 'À retenter')
    .gte('date_previsionnelle', today)
    .select('id')
  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ok: true, count: data?.length ?? 0 })
}
