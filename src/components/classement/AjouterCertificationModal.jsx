import { useState } from 'react'
import Modal from '../shared/Modal'
import { useNomCertifications } from '../../hooks/useRessources'
import { supabase } from '../../lib/supabase'

export default function AjouterCertificationModal({ consultantId, onClose, onAdded }) {
  const noms = useNomCertifications()
  const [form, setForm] = useState({ nom: '', type: 'Certification', statut: 'Planifiée', date_previsionnelle: '', date_obtention: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const certifications  = noms.filter(n => n.categorie === 'Certification')
  const accreditations  = noms.filter(n => n.categorie === 'Accreditation')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nom) { setError('Choisis une certification.'); return }
    if (form.statut === 'Planifiée' && !form.date_previsionnelle) { setError('Date prévisionnelle obligatoire.'); return }
    if (form.statut === 'Obtenue' && !form.date_obtention) { setError('Date d\'obtention obligatoire.'); return }
    setSaving(true)
    const { error } = await supabase.from('certifications').insert({
      consultant_id:      consultantId,
      nom_certification:  form.nom,
      type:               form.type,
      statut:             form.statut,
      date_previsionnelle: form.date_previsionnelle || null,
      date_obtention:     form.date_obtention || null,
      notes:              form.notes || null,
    })
    if (error) { setError(error.message); setSaving(false); return }
    onAdded()
  }

  return (
    <Modal title="Ajouter une certification" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Type</label>
          <div className="flex gap-2">
            {['Certification', 'Accreditation'].map(t => (
              <button key={t} type="button"
                onClick={() => setForm(f => ({...f, type: t, nom: ''}))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${form.type === t ? 'bg-brand-600 border-brand-500 text-white' : 'border-slate-700 text-slate-400 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Nom *</label>
          <select className="input" value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} required>
            <option value="">— Choisir —</option>
            {(form.type === 'Certification' ? certifications : accreditations).map(n => (
              <option key={n.id} value={n.nom}>{n.nom}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Statut</label>
          <select className="input" value={form.statut} onChange={e => setForm(f => ({...f, statut: e.target.value}))}>
            <option>Planifiée</option>
            <option>Obtenue</option>
            <option>À retenter</option>
          </select>
        </div>

        {form.statut === 'Planifiée' && (
          <div>
            <label className="label">Date prévisionnelle *</label>
            <input className="input" type="date" value={form.date_previsionnelle}
              onChange={e => setForm(f => ({...f, date_previsionnelle: e.target.value}))} required />
          </div>
        )}
        {form.statut === 'Obtenue' && (
          <div>
            <label className="label">Date d'obtention *</label>
            <input className="input" type="date" value={form.date_obtention}
              onChange={e => setForm(f => ({...f, date_obtention: e.target.value}))} required />
          </div>
        )}

        <div>
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={2} value={form.notes}
            onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Annuler</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
