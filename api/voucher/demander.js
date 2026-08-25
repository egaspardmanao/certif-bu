import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { getEmailSettings } from '../_lib/emailSettings.js'
import { sendEmail } from '../_lib/resend.js'
import * as templates from '../_lib/emailTemplates.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const { certificationId } = req.body || {}
  if (!certificationId) return res.status(400).json({ error: 'certificationId manquant' })

  const supabaseAdmin = getSupabaseAdmin()

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token)
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Non authentifié' })

  const { data: result, error: rpcErr } = await supabaseAdmin.rpc('demander_voucher', {
    p_certification_id: certificationId,
  })
  if (rpcErr) return res.status(500).json({ error: rpcErr.message })

  try {
    await envoyerEmailPourResultat(supabaseAdmin, certificationId, result)
  } catch (e) {
    console.error('Échec envoi email demande voucher:', e)
  }

  return res.status(200).json(result)
}

async function envoyerEmailPourResultat(supabaseAdmin, certificationId, result) {
  const statut = result?.statut
  if (!statut || statut === 'erreur' || statut === 'multi-demande') return

  const { data: cert } = await supabaseAdmin
    .from('certifications')
    .select('*, consultants(*)')
    .eq('id', certificationId)
    .single()
  if (!cert) return
  const consultant = cert.consultants

  const settings = await getEmailSettings(supabaseAdmin)

  let email
  if (statut === 'accreditation') {
    email = templates.accreditation({ consultant, cert, settings })
  } else if (statut === 'repassage') {
    email = templates.repassage({ consultant, cert, settings })
  } else if (statut === 'limite') {
    email = templates.depassementLimite({ consultant, cert, nbVouchers: consultant.vouchers_annee_civile, settings })
  } else if (statut === 'indisponible') {
    email = templates.pasDeVoucher({ consultant, cert, settings })
  } else if (statut === 'attribue') {
    const { data: voucher } = await supabaseAdmin
      .from('vouchers')
      .select('*')
      .eq('id', cert.voucher_id)
      .single()
    if (!voucher) return
    email = templates.voucherAttribue({ consultant, cert, voucher, settings })
  } else {
    return
  }

  await sendEmail({ ...email, senderEmail: settings.senderEmail })
}
