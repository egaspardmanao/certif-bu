import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { getEmailSettings } from '../_lib/emailSettings.js'
import { sendEmail } from '../_lib/resend.js'
import { voucherAttribue } from '../_lib/emailTemplates.js'

// Attribution manuelle d'un voucher par un admin (ex. dérogation à la limite de 4/an),
// équivalent du Flow RT_Voucher_Email_Attribution qui se déclenche aussi sur ce cas côté Salesforce.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const { voucherId, certificationId } = req.body || {}
  if (!voucherId || !certificationId) return res.status(400).json({ error: 'voucherId et certificationId requis' })

  const supabaseAdmin = getSupabaseAdmin()

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token)
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Non authentifié' })

  const { data: caller } = await supabaseAdmin.from('consultants').select('is_admin').eq('email', userData.user.email).maybeSingle()
  if (!caller?.is_admin) return res.status(403).json({ error: 'Réservé aux administrateurs' })

  const { data: cert } = await supabaseAdmin
    .from('certifications')
    .select('*, consultants(*)')
    .eq('id', certificationId)
    .single()
  if (!cert) return res.status(404).json({ error: 'Certification introuvable' })

  const { data: voucher } = await supabaseAdmin.from('vouchers').select('*').eq('id', voucherId).single()
  if (!voucher) return res.status(404).json({ error: 'Voucher introuvable' })

  await supabaseAdmin.from('vouchers').update({
    statut: 'Attribué',
    consultant_id: cert.consultant_id,
    certification_id: cert.id,
    date_attribution: new Date().toISOString().slice(0, 10),
    date_expiration: cert.date_previsionnelle,
    updated_at: new Date(),
  }).eq('id', voucherId)

  await supabaseAdmin.from('certifications').update({ voucher_id: voucherId, updated_at: new Date() }).eq('id', certificationId)
  await supabaseAdmin.from('consultants').update({
    vouchers_annee_civile: (cert.consultants.vouchers_annee_civile ?? 0) + 1,
  }).eq('id', cert.consultant_id)

  try {
    const settings = await getEmailSettings(supabaseAdmin)
    await sendEmail({
      ...voucherAttribue({ consultant: cert.consultants, cert, voucher, settings }),
      senderEmail: settings.senderEmail,
    })
  } catch (e) {
    console.error('Échec email attribution manuelle voucher:', e)
  }

  return res.status(200).json({ ok: true })
}
