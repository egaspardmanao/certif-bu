import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function EmailSettingsPanel({ showToast }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('email_settings').select('*').eq('id', 1).single()
      .then(({ data }) => setForm(data))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('email_settings').update({
      responsable_email:  form.responsable_email,
      responsable_prenom: form.responsable_prenom,
      sender_email:        form.sender_email,
      admin_email:          form.admin_email,
      updated_at: new Date(),
    }).eq('id', 1)
    setSaving(false)
    if (error) { showToast('Erreur : ' + error.message, 'error'); return }
    showToast('Paramètres email enregistrés.', 'success')
  }

  if (!form) return <div className="text-slate-500 text-sm">Chargement…</div>

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4 max-w-lg">
      <div>
        <label className="label">Email du responsable certif</label>
        <input className="input" type="email" value={form.responsable_email}
          onChange={e => setForm(f => ({...f, responsable_email: e.target.value}))} required />
        <p className="text-xs text-slate-500 mt-1">Mis en copie sur les alertes vouchers/certifications.</p>
      </div>
      <div>
        <label className="label">Prénom du responsable</label>
        <input className="input" value={form.responsable_prenom}
          onChange={e => setForm(f => ({...f, responsable_prenom: e.target.value}))} required />
      </div>
      <div>
        <label className="label">Adresse d'expédition (sender)</label>
        <input className="input" type="email" value={form.sender_email}
          onChange={e => setForm(f => ({...f, sender_email: e.target.value}))} required />
        <p className="text-xs text-slate-500 mt-1">Doit être un expéditeur autorisé sur Resend (ex. onboarding@resend.dev en mode test).</p>
      </div>
      <div>
        <label className="label">Email administrateur technique</label>
        <input className="input" type="email" value={form.admin_email}
          onChange={e => setForm(f => ({...f, admin_email: e.target.value}))} required />
      </div>
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
