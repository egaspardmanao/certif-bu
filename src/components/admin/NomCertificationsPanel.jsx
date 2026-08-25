import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function NomCertificationsPanel({ showToast }) {
  const [noms, setNoms] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nom: '', categorie: 'Certification' })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editNom, setEditNom] = useState('')

  async function fetchNoms() {
    setLoading(true)
    const { data } = await supabase.from('nom_certifications').select('*').order('categorie').order('ordre')
    setNoms(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchNoms() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.nom.trim()) return
    setSaving(true)
    const { error } = await supabase.from('nom_certifications').insert({
      nom: form.nom.trim(), categorie: form.categorie, actif: true,
    })
    setSaving(false)
    if (error) { showToast('Erreur : ' + error.message, 'error'); return }
    setForm({ nom: '', categorie: 'Certification' })
    showToast('Certification ajoutée.', 'success')
    fetchNoms()
  }

  async function toggleActif(item) {
    await supabase.from('nom_certifications').update({ actif: !item.actif }).eq('id', item.id)
    fetchNoms()
  }

  async function handleRename(item) {
    const nom = editNom.trim()
    if (!nom || nom === item.nom) { setEditingId(null); return }
    const { error } = await supabase.from('nom_certifications').update({ nom }).eq('id', item.id)
    if (error) { showToast('Erreur : ' + error.message, 'error'); return }
    setEditingId(null)
    showToast('Renommé.', 'success')
    fetchNoms()
  }

  async function handleDelete(item) {
    const { count } = await supabase.from('certifications')
      .select('id', { count: 'exact', head: true })
      .eq('nom_certification', item.nom)
    if (count > 0) {
      showToast(`Impossible de supprimer : ${count} certification(s) enregistrée(s) sous ce nom. Désactive-la plutôt.`, 'error')
      return
    }
    if (!confirm(`Supprimer "${item.nom}" du catalogue ?`)) return
    const { error } = await supabase.from('nom_certifications').delete().eq('id', item.id)
    if (error) { showToast('Erreur : ' + error.message, 'error'); return }
    showToast('Supprimé.', 'info')
    fetchNoms()
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="card p-4 mb-4 flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <label className="label">Nom de la certification / accréditation</label>
          <input className="input" value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))}
            placeholder="ex. Salesforce Certified Data Cloud Consultant" required />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.categorie} onChange={e => setForm(f => ({...f, categorie: e.target.value}))}>
            <option value="Certification">Certification</option>
            <option value="Accreditation">Accreditation</option>
          </select>
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
          <Plus size={14} /> Ajouter
        </button>
      </form>

      {loading ? (
        <div className="text-slate-500 text-sm">Chargement…</div>
      ) : (
        <div className="card divide-y divide-slate-200">
          {noms.map(item => editingId === item.id ? (
            <div key={item.id} className="flex items-center gap-2 px-4 py-2.5">
              <input className="input flex-1" value={editNom} onChange={e => setEditNom(e.target.value)} autoFocus />
              <button onClick={() => handleRename(item)} className="p-2 text-emerald-600 hover:text-emerald-700"><Check size={16} /></button>
              <button onClick={() => setEditingId(null)} className="p-2 text-slate-500 hover:text-slate-900"><X size={16} /></button>
            </div>
          ) : (
            <div key={item.id} className="flex items-center justify-between px-4 py-2.5 group">
              <div>
                <span className="text-sm text-slate-900">{item.nom}</span>
                <span className="ml-2 text-xs text-slate-500">{item.categorie}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActif(item)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    item.actif ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                  {item.actif ? 'Actif' : 'Désactivé'}
                </button>
                <button onClick={() => { setEditingId(item.id); setEditNom(item.nom) }}
                  className="p-1 text-slate-400 hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity"><Pencil size={13} /></button>
                <button onClick={() => handleDelete(item)}
                  className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
