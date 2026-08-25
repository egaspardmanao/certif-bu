import { getSupabaseAdmin } from './_lib/supabaseAdmin.js'
import { getEmailSettings } from './_lib/emailSettings.js'
import { sendEmail } from './_lib/resend.js'
import { nomCertManuel } from './_lib/emailTemplates.js'

// Notifie l'admin technique quand un consultant saisit une certification hors liste officielle
// (équivalent notifierNomCertManuel() côté Salesforce).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { valeur, consultantNom } = req.body || {}
  if (!valeur) return res.status(400).json({ error: 'valeur manquante' })

  const supabaseAdmin = getSupabaseAdmin()
  const settings = await getEmailSettings(supabaseAdmin)

  try {
    await sendEmail({
      ...nomCertManuel({ consultantNom: consultantNom || 'Un consultant', valeur, settings }),
      senderEmail: settings.senderEmail,
    })
  } catch (e) {
    console.error('Échec email nom-certification-manuel:', e)
  }

  return res.status(200).json({ ok: true })
}
