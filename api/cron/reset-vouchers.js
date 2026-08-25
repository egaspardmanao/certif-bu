import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { isAuthorizedCron } from '../_lib/cronAuth.js'

// 1er janvier : remise à zéro du compteur de vouchers annuel de tous les consultants.
export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'Non autorisé' })

  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin.rpc('reset_vouchers_annee_civile')
  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ok: true })
}
