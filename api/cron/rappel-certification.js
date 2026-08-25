import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { isAuthorizedCron } from '../_lib/cronAuth.js'
import { getEmailSettings } from '../_lib/emailSettings.js'
import { sendEmail } from '../_lib/resend.js'
import { rappelMiseAJour } from '../_lib/emailTemplates.js'

// Certification Planifiée dont la date prévisionnelle est strictement dépassée (jamais le jour même)
// → statut 'À retenter' + email de rappel au consultant.
export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'Non autorisé' })

  const supabaseAdmin = getSupabaseAdmin()
  const today = new Date().toISOString().slice(0, 10)

  const { data: certs, error } = await supabaseAdmin
    .from('certifications')
    .select('*, consultants(*)')
    .eq('statut', 'Planifiée')
    .lt('date_previsionnelle', today)
  if (error) return res.status(500).json({ error: error.message })

  const settings = await getEmailSettings(supabaseAdmin)
  let count = 0

  for (const cert of certs || []) {
    const consultant = cert.consultants
    if (!consultant?.email) continue

    await supabaseAdmin.from('certifications').update({ statut: 'À retenter' }).eq('id', cert.id)

    try {
      await sendEmail({ ...rappelMiseAJour({ consultant, cert, settings, appUrl: process.env.APP_URL }), senderEmail: settings.senderEmail })
      count++
    } catch (e) {
      console.error('Échec email rappel-certification:', cert.id, e)
    }
  }

  return res.status(200).json({ ok: true, count })
}
