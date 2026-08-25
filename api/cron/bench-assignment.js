import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { isAuthorizedCron } from '../_lib/cronAuth.js'

// Consultants actifs visibles sans aucune mission → affectés au projet BENCH.
export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'Non autorisé' })

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin.rpc('bench_assignment')
  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ok: true, count: data })
}
