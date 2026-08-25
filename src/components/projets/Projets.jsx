import { useState, useMemo } from 'react'
import { Plus, Trash2, Flag, RotateCcw, Users, Edit2 } from 'lucide-react'
import { useProjets } from '../../hooks/useProjets'
import { useClassement, useToutesLesPersonnes } from '../../hooks/useClassement'
import { useIsAdmin } from '../../hooks/useIsAdmin'
import Avatar from '../shared/Avatar'
import Modal from '../shared/Modal'
import { supabase } from '../../lib/supabase'
import { useToast } from '../shared/Toast'
import Toast from '../shared/Toast'

// --- Statistiques ---
function Stats({ projets, consultants }) {
  const actifs     = projets.filter(p => !p.est_special && !p.termine).length
  const surBench   = projets.find(p => p.nom === 'BENCH')?.missions?.length ?? 0
  return (
    <div className="flex gap-6 mb-6 text-sm">
      <div><span className="text-2xl font-display font-bold text-white">{consultants.length}</span> <span className="text-slate-400">consultants</span></div>
      <div><span className="text-2xl font-display font-bold text-white">{actifs}</span> <span className="text-slate-400">projets actifs</span></div>
      <div><span className="text-2xl font-display font-bold text-brand-400">{surBench}</span> <span className="text-slate-400">sur le bench</span></div>
    </div>
  )
}

// --- Carte projet ---
function CarteProjet({ projet, onClick }) {
  const consultants = projet.missions ?? []
  const noms = consultants.map(m => `${m.consultant?.prenom} ${m.consultant?.nom}`).join(', ')
  return (
    <button onClick={() => onClick(projet)}
      className={`card p-4 text-left w-full hover:border-slate-600 transition-all group ${projet.est_special ? 'border-pink-800/60' : ''} ${projet.termine ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-display font-bold text-base text-white leading-tight">{projet.nom}</div>
        <span className="text-xs text-slate-500 shrink-0">{consultants.length} consultant{consultants.length > 1 ? 's' : ''}</span>
      </div>
      {projet.responsable && (
        <div className="text-xs text-slate-500 mb-1">Resp. : {projet.responsable.prenom} {projet.responsable.nom}</div>
      )}
      {noms && (
        <div className="text-xs text-slate-400 line-clamp-2">{noms}</div>
      )}
    </button>
  )
}

// --- Modal création/édition projet ---
function ProjetModal({ projet, consultants, onClose, onSaved }) {
  const [form, setForm]   = useState({ nom: projet?.nom ?? '', responsable_id: projet?.responsable?.id ?? '' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    if (projet) {
      await supabase.from('projets').update({ nom: form.nom.trim(), responsable_id: form.responsable_id || null, updated_at: new Date() }).eq('id', projet.id)
    } else {
      await supabase.from('projets').insert({ nom: form.nom.trim(), responsable_id: form.responsable_id || null })
    }
    onSaved()
  }

  return (
    <Modal title={projet ? 'Modifier le projet' : 'Nouveau projet'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Nom du projet *</label>
          <input className="input" value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} required />
        </div>
        <div>
          <label className="label">Responsable</label>
          <select className="input" value={form.responsable_id} onChange={e => setForm(f => ({...f, responsable_id: e.target.value}))}>
            <option value="">— Aucun responsable —</option>
            {consultants.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Annuler</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  )
}

// --- Panneau détail projet ---
function PanneauProjet({ projet, allConsultants, toutesLesPersonnes, onClose, onUpdated, showToast }) {
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const isAdmin = useIsAdmin()
  const consultantsDuProjet = projet.missions?.map(m => m.consultant).filter(Boolean) ?? []

  const consultantsDisponibles = allConsultants.filter(
    c => !consultantsDuProjet.some(pc => pc.id === c.id)
  )

  async function handleAddConsultant(consultantId) {
    await supabase.from('missions').insert({ projet_id: projet.id, consultant_id: consultantId, statut: 'En mission' })
    showToast('Consultant ajouté !', 'success')
    onUpdated()
    setAddOpen(false)
  }

  async function handleRemoveConsultant(missionId) {
    await supabase.from('missions').delete().eq('id', missionId)
    showToast('Consultant retiré.', 'info')
    onUpdated()
  }

  async function handleTerminer() {
    if (!confirm(`Terminer le projet "${projet.nom}" ? Tous les consultants seront retirés.`)) return
    await supabase.from('missions').delete().eq('projet_id', projet.id)
    await supabase.from('projets').update({ termine: true, responsable_id: null, updated_at: new Date() }).eq('id', projet.id)
    showToast('Projet terminé.', 'info')
    onUpdated()
    onClose()
  }

  async function handleReprendre() {
    await supabase.from('projets').update({ termine: false, updated_at: new Date() }).eq('id', projet.id)
    showToast('Projet repris !', 'success')
    onUpdated()
  }

  async function handleDelete() {
    if (!confirm(`Supprimer définitivement "${projet.nom}" ?`)) return
    await supabase.from('missions').delete().eq('projet_id', projet.id)
    await supabase.from('projets').delete().eq('id', projet.id)
    showToast('Projet supprimé.', 'info')
    onUpdated()
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-display font-bold text-xl text-white">{projet.nom}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1">✕</button>
        </div>
        <div className="flex-1 p-5 space-y-5">
          {projet.responsable && (
            <div>
              <div className="section-title">Responsable</div>
              <div className="flex items-center gap-2">
                <Avatar consultant={projet.responsable} size="sm" />
                <span className="text-sm text-white">{projet.responsable.prenom} {projet.responsable.nom}</span>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="section-title mb-0">Consultants ({consultantsDuProjet.length})</div>
              <button onClick={() => setAddOpen(true)} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                <Plus size={12} /> Ajouter
              </button>
            </div>
            <div className="space-y-1">
              {consultantsDuProjet.map((c, i) => {
                const mission = projet.missions?.[i]
                return (
                  <div key={c.id} className="flex items-center gap-2 group">
                    <Avatar consultant={c} size="sm" />
                    <span className="flex-1 text-sm text-white">{c.prenom} {c.nom}</span>
                    <button onClick={() => handleRemoveConsultant(mission?.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
              {consultantsDuProjet.length === 0 && <p className="text-slate-500 text-sm">Aucun consultant affecté.</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <button onClick={() => setEditOpen(true)} className="btn-ghost w-full flex items-center justify-center gap-2 text-sm">
              <Edit2 size={14} /> Modifier le projet
            </button>
            {!projet.termine ? (
              <button onClick={handleTerminer} className="btn-ghost w-full flex items-center justify-center gap-2 text-sm text-orange-400 border-orange-800/50">
                <Flag size={14} /> Terminer le projet
              </button>
            ) : (
              <button onClick={handleReprendre} className="btn-ghost w-full flex items-center justify-center gap-2 text-sm text-emerald-400 border-emerald-800/50">
                <RotateCcw size={14} /> Reprendre le projet
              </button>
            )}
            {!projet.est_special && isAdmin && (
              <button onClick={handleDelete} className="btn-danger w-full flex items-center justify-center gap-2 text-sm">
                <Trash2 size={14} /> Supprimer définitivement
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal ajout consultant */}
      {addOpen && (
        <Modal title="Ajouter un consultant" onClose={() => setAddOpen(false)}>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {consultantsDisponibles.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Tous les consultants sont déjà affectés.</p>}
            {consultantsDisponibles.map(c => (
              <button key={c.id} onClick={() => handleAddConsultant(c.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                <Avatar consultant={c} size="sm" />
                <span className="text-sm text-white">{c.prenom} {c.nom}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {editOpen && (
        <ProjetModal projet={projet} consultants={toutesLesPersonnes}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); onUpdated() }} />
      )}
    </>
  )
}

// --- Composant principal ---
export default function Projets() {
  const { projets, loading, refetch } = useProjets()
  const { consultants }               = useClassement()
  const { personnes: toutesLesPersonnes } = useToutesLesPersonnes()
  const [selected, setSelected]       = useState(null)
  const [addOpen, setAddOpen]         = useState(false)
  const { toast, show, hide }         = useToast()

  const speciaux  = projets.filter(p => p.est_special && !p.termine)
  const actifs    = projets.filter(p => !p.est_special && !p.termine).sort((a, b) => (b.missions?.length ?? 0) - (a.missions?.length ?? 0))
  const termines  = projets.filter(p => p.termine)

  if (loading) return <div className="text-center py-16 text-slate-500">Chargement…</div>

  return (
    <div>
      <Stats projets={projets} consultants={consultants} />

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-white">Projets actifs</h3>
        <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> Nouveau projet
        </button>
      </div>

      {/* Projets spéciaux (BENCH / HOME) */}
      {speciaux.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {speciaux.map(p => <CarteProjet key={p.id} projet={p} onClick={setSelected} />)}
        </div>
      )}

      {/* Projets actifs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {actifs.map(p => <CarteProjet key={p.id} projet={p} onClick={setSelected} />)}
        {actifs.length === 0 && <div className="col-span-3 card p-8 text-center text-slate-500">Aucun projet actif.</div>}
      </div>

      {/* Anciens projets */}
      {termines.length > 0 && (
        <>
          <div className="section-title">📦 Anciens projets</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {termines.map(p => <CarteProjet key={p.id} projet={p} onClick={setSelected} />)}
          </div>
        </>
      )}

      {/* Panneau détail */}
      {selected && (
        <PanneauProjet
          projet={selected}
          allConsultants={consultants}
          toutesLesPersonnes={toutesLesPersonnes}
          onClose={() => setSelected(null)}
          onUpdated={() => { refetch(); setSelected(null) }}
          showToast={show}
        />
      )}

      {/* Modal nouveau projet */}
      {addOpen && (
        <ProjetModal consultants={toutesLesPersonnes}
          onClose={() => setAddOpen(false)}
          onSaved={() => { setAddOpen(false); refetch(); show('Projet créé !', 'success') }} />
      )}

      {toast && <Toast {...toast} onClose={hide} />}
    </div>
  )
}
