import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { isAuthorizedCron } from '../_lib/cronAuth.js'
import { sendEmail } from '../_lib/resend.js'
import { bonneChance } from '../_lib/emailTemplates.js'
import { getEmailSettings } from '../_lib/emailSettings.js'

// Certification Planifiée dont la date prévisionnelle est aujourd'hui → email "bonne chance"
// envoyé uniquement au consultant (pas de CC responsable).
export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'Non autorisé' })

  const supabaseAdmin = getSupabaseAdmin()
  const today = new Date().toISOString().slice(0, 10)

  const { data: certs, error } = await supabaseAdmin
    .from('certifications')
    .select('*, consultants(*)')
    .eq('statut', 'Planifiée')
    .eq('date_previsionnelle', today)
  if (error) return res.status(500).json({ error: error.message })

  const settings = await getEmailSettings(supabaseAdmin)
  let count = 0

  for (const cert of certs || []) {
    const consultant = cert.consultants
    if (!consultant?.email) continue
    try {
      await sendEmail({ ...bonneChance({ consultant, cert }), senderEmail: settings.senderEmail })
      count++
    } catch (e) {
      console.error('Échec email bonne-chance:', cert.id, e)
    }
  }

  return res.status(200).json({ ok: true, count })
}
