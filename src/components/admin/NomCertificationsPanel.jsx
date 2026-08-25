import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function NomCertificationsPanel({ showToast }) {
  const [noms, setNoms] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nom: '', categorie: 'Certification' })
  const [saving, setSaving] = useState(false)

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
        <div className="card divide-y divide-slate-800">
          {noms.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <span className="text-sm text-white">{item.nom}</span>
                <span className="ml-2 text-xs text-slate-500">{item.categorie}</span>
              </div>
              <button onClick={() => toggleActif(item)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  item.actif ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-800 text-slate-500'
                }`}>
                {item.actif ? 'Actif' : 'Désactivé'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
