import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { isAuthorizedCron } from '../_lib/cronAuth.js'
import { sendEmail } from '../_lib/resend.js'
import { vouchersExpiration } from '../_lib/emailTemplates.js'
import { getEmailSettings } from '../_lib/emailSettings.js'

function monthRange(offsetMonths) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 1)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

// 1er du mois : récap des vouchers Disponibles arrivant à expiration ce mois-ci / le mois prochain,
// plus l'état global du stock (Disponible / Attribué). Envoyé au Responsable Certif uniquement.
export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'Non autorisé' })

  const supabaseAdmin = getSupabaseAdmin()
  const ceMois = monthRange(0)
  const moisProchain = monthRange(1)

  const countExpiringIn = async (range) => {
    const { count } = await supabaseAdmin
      .from('vouchers')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'Disponible')
      .gte('date_fin_validite', range.start)
      .lt('date_fin_validite', range.end)
    return count ?? 0
  }

  const nbCeMois = await countExpiringIn(ceMois)
  const nbMoisProchain = await countExpiringIn(moisProchain)

  const { count: nbDisponibles } = await supabaseAdmin
    .from('vouchers').select('id', { count: 'exact', head: true }).eq('statut', 'Disponible')
  const { count: nbAttribues } = await supabaseAdmin
    .from('vouchers').select('id', { count: 'exact', head: true }).eq('statut', 'Attribué')

  const settings = await getEmailSettings(supabaseAdmin)

  await sendEmail({
    ...vouchersExpiration({
      nbCeMois, nbMoisProchain,
      nbDisponibles: nbDisponibles ?? 0,
      nbAttribues: nbAttribues ?? 0,
      settings,
    }),
    senderEmail: settings.senderEmail,
  })

  return res.status(200).json({ ok: true, nbCeMois, nbMoisProchain })
}
