import { useState } from 'react'
import { Plus, ExternalLink, Trash2, BookOpen, FileText } from 'lucide-react'
import { useRessources, useNomCertifications } from '../../hooks/useRessources'
import { useClassement } from '../../hooks/useClassement'
import Modal from '../shared/Modal'
import Avatar from '../shared/Avatar'
import { supabase } from '../../lib/supabase'
import { RESSOURCE_TYPES } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import { useToast } from '../shared/Toast'
import Toast from '../shared/Toast'

function AddRessourceModal({ nomCertification, onClose, onAdded }) {
  const [form, setForm]   = useState({ nom: '', type: 'Site', url: '', notes: '' })
  const [file, setFile]   = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nom) { setError('Titre obligatoire.'); return }
    setSaving(true)

    let fichier_url = null, fichier_nom = null
    if (form.type === 'PDF' && file) {
      const path = `ressources/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage.from('ressources').upload(path, file)
      if (upErr) { setError('Erreur upload : ' + upErr.message); setSaving(false); return }
      const { data: { publicUrl } } = supabase.storage.from('ressources').getPublicUrl(path)
      fichier_url = publicUrl
      fichier_nom = file.name
    }

    const { error } = await supabase.from('ressources').insert({
      nom: form.nom.trim(),
      nom_certification: nomCertification,
      type: form.type,
      url: form.url || null,
      notes: form.notes || null,
      fichier_url, fichier_nom,
    })
    if (error) { setError(error.message); setSaving(false); return }
    onAdded()
  }

  return (
    <Modal title="Ajouter une ressource" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Titre *</label>
          <input className="input" placeholder="ex: Guide Trailhead Admin" value={form.nom}
            onChange={e => setForm(f => ({...f, nom: e.target.value}))} required />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
            {RESSOURCE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        {form.type === 'PDF' ? (
          <div>
            <label className="label">Fichier PDF</label>
            <input className="input" type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0])} />
          </div>
        ) : (
          <div>
            <label className="label">URL</label>
            <input className="input" type="url" placeholder="https://…" value={form.url}
              onChange={e => setForm(f => ({...f, url: e.target.value}))} />
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
          <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Envoi…' : 'Ajouter'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Ressources() {
  const noms = useNomCertifications()
  const { consultants } = useClassement()
  const [selected, setSelected]   = useState('')
  const { ressources, loading, refetch } = useRessources(selected)
  const [addOpen, setAddOpen]     = useState(false)
  const { toast, show, hide }     = useToast()

  const nomCertification = selected

  // Collègues certifiés sur cette certification
  const colleguesCertifies = consultants.flatMap(c =>
    (c.certifications ?? [])
      .filter(cert => cert.nom_certification === selected && cert.statut === 'Obtenue')
      .map(cert => ({ ...c, date_obtention: cert.date_obtention }))
  ).sort((a, b) => (b.date_obtention ?? '').localeCompare(a.date_obtention ?? ''))

  async function handleDelete(id, fichier_url) {
    if (!confirm('Supprimer cette ressource ?')) return
    await supabase.from('ressources').delete().eq('id', id)
    show('Ressource supprimée.', 'info')
    refetch()
  }

  const TYPE_ICONS = { Trailhead: '🌟', PDF: '📄', Drive: '📁', Vidéo: '🎬', Site: '🌐', Autre: '📎' }

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar : liste des certifications */}
      <div className="w-56 shrink-0">
        <div className="section-title">Certifications</div>
        <div className="space-y-0.5 max-h-[70vh] overflow-y-auto pr-1">
          {noms.filter(n => n.categorie === 'Certification').map(n => (
            <button key={n.id} onClick={() => setSelected(n.nom)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selected === n.nom ? 'bg-brand-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              {n.nom.replace('Salesforce Certified ', '')}
            </button>
          ))}
          <div className="text-xs font-bold text-slate-600 px-3 py-2 uppercase tracking-wider mt-2">Accréditations</div>
          {noms.filter(n => n.categorie === 'Accreditation').map(n => (
            <button key={n.id} onClick={() => setSelected(n.nom)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selected === n.nom ? 'bg-gold-500/30 text-gold-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              {n.nom.replace(' Accredited Professional', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 min-w-0">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2">
            <BookOpen size={32} className="opacity-30" />
            <p>👈 Sélectionne une certification pour voir ses ressources</p>
          </div>
        ) : (
          <>
            {/* Collègues certifiés */}
            {colleguesCertifies.length > 0 && (
              <div className="card p-4 mb-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Pour bien t'aider, quoi de mieux qu'un collègue…
                </div>
                <div className="flex flex-wrap gap-2">
                  {colleguesCertifies.map(c => (
                    <div key={c.id} className="flex items-center gap-1.5 bg-slate-800 rounded-full px-2.5 py-1">
                      <Avatar consultant={c} size="sm" />
                      <span className="text-sm text-white">{c.prenom} {c.nom}</span>
                      {c.date_obtention && <span className="text-xs text-slate-500">{formatDate(c.date_obtention, 'MMM yyyy')}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Header ressources */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-white">
                {selected.replace('Salesforce Certified ', '')}
              </h3>
              <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={14} /> Ajouter une ressource
              </button>
            </div>

            {/* Liste des ressources */}
            {loading ? <div className="text-slate-500 text-sm">Chargement…</div> : (
              <div className="space-y-2">
                {ressources.length === 0 && (
                  <div className="card p-8 text-center text-slate-500">
                    Aucune ressource pour cette certification.<br />
                    <span className="text-sm">Sois le premier à en partager une !</span>
                  </div>
                )}
                {ressources.map(r => (
                  <div key={r.id} className="card p-4 flex items-start gap-3 group">
                    <span className="text-xl">{TYPE_ICONS[r.type] ?? '📎'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white">{r.nom}</div>
                      {r.notes && <div className="text-sm text-slate-400 mt-0.5">{r.notes}</div>}
                      <div className="text-xs text-slate-600 mt-1">{r.type} · {formatDate(r.created_at)}</div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(r.url || r.fichier_url) && (
                        <a href={r.url ?? r.fichier_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-slate-500 hover:text-brand-400 transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button onClick={() => handleDelete(r.id, r.fichier_url)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {addOpen && selected && (
        <AddRessourceModal
          nomCertification={selected}
          onClose={() => setAddOpen(false)}
          onAdded={() => { setAddOpen(false); refetch(); show('Ressource ajoutée !', 'success') }}
        />
      )}
      {toast && <Toast {...toast} onClose={hide} />}
    </div>
  )
}
