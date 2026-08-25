// Équivalent Certification_Email_Settings__mdt : une seule ligne (id=1) dans la table email_settings.
export async function getEmailSettings(supabaseAdmin) {
  const { data } = await supabaseAdmin.from('email_settings').select('*').eq('id', 1).single()
  return {
    responsableEmail: data?.responsable_email || 'responsable@yourcompany.com',
    responsablePrenom: data?.responsable_prenom || 'Responsable',
    senderEmail: data?.sender_email || 'noreply@yourcompany.com',
    adminEmail: data?.admin_email || 'admin@yourcompany.com',
  }
}
