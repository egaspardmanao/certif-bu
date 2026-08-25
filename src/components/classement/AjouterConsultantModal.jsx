import { useState } from 'react'
import Modal from '../shared/Modal'
import { supabase } from '../../lib/supabase'

export default function AjouterConsultantModal({ consultants, onClose, onAdded }) {
  const [form, setForm]     = useState({ prenom: '', nom: '', email: '', manager_id: '', birthdate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.prenom || !form.nom) { setError('Prénom et nom obligatoires.'); return }
    setSaving(true)
    const { error } = await supabase.from('consultants').insert({
      prenom:            form.prenom.trim(),
      nom:               form.nom.trim(),
      email:             form.email || null,
      manager_id:        form.manager_id || null,
      actif:             true,
      hide_for_community: false,
    })
    if (error) { setError('Erreur lors de la création : ' + error.message); setSaving(false); return }
    onAdded()
  }

  return (
    <Modal title="Ajouter un consultant" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Prénom *</label>
            <input className="input" value={form.prenom} onChange={e => setForm(f => ({...f, prenom: e.target.value}))} required />
          </div>
          <div>
            <label className="label">Nom *</label>
            <input className="input" value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} required />
          </div>
        </div>
        <div>
          <label className="label">Email (optionnel)</label>
          <input className="input" type="email" placeholder="pour la connexion au portail" value={form.email}
            onChange={e => setForm(f => ({...f, email: e.target.value}))} />
        </div>
        <div>
          <label className="label">Manager</label>
          <select className="input" value={form.manager_id} onChange={e => setForm(f => ({...f, manager_id: e.target.value}))}>
            <option value="">— Aucun manager —</option>
            {consultants.map(c => (
              <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Annuler</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Création…' : 'Créer le consultant'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
