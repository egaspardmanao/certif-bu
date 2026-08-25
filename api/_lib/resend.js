const RESEND_API_URL = 'https://api.resend.com/emails'

export async function sendEmail({ to, cc, subject, text, senderEmail, senderName = 'Équipe BU Salesforce Inetum' }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY manquante')

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${senderName} <${senderEmail}>`,
      to: Array.isArray(to) ? to : [to],
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      subject,
      text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend a échoué (${res.status}): ${body}`)
  }
  return res.json()
}
