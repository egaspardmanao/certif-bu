import { useState } from 'react'
import { X, Plus, Ticket, Edit2, Trash2 } from 'lucide-react'
import { useConsultant } from '../../hooks/useClassement'
import Avatar from '../shared/Avatar'
import { StatutBadge, TypeBadge } from '../shared/Badge'
import Modal from '../shared/Modal'
import { formatDate, isAccreditation } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { CERT_STATUTS } from '../../lib/constants'
import AjouterCertificationModal from './AjouterCertificationModal'
import AjouterConsultantModal from './AjouterConsultantModal'

export default function PanneauConsultant({ consultantId, onClose, onUpdated, showToast, toutesLesPersonnes }) {
  const { consultant, loading, refetch } = useConsultant(consultantId)
  const [addCertOpen, setAddCertOpen] = useState(false)
  const [uploadOpen, setUploadOpen]   = useState(false)
  const [editOpen, setEditOpen]       = useState(false)

  async function handleDemanderVoucher(certId) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/voucher/demander', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ certificationId: certId }),
    })
    if (!res.ok) { showToast('Erreur lors de la demande.', 'error'); return }
    const data = await res.json()
    const statut = data?.statut
    const isSuccess = statut === 'attribue'
    showToast(data?.message ?? 'Demande envoyée.', isSuccess ? 'success' : 'info')
    if (isSuccess) { refetch(); onUpdated() }
  }

  async function handleDeleteCert(certId) {
    const motdepasse = window.prompt('Confirmation : tape "SUPPRIMER" pour confirmer la suppression.')
    if (motdepasse !== 'SUPPRIMER') return
    await supabase.from('certifications').delete().eq('id', certId)
    showToast('Certification supprimée.', 'success')
    refetch()
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !consultant) return
    const ext  = file.name.split('.').pop()
    const path = `photos/${consultant.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { showToast('Erreur upload photo : ' + upErr.message, 'error'); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('consultants').update({ photo_url: publicUrl }).eq('id', consultant.id)
    showToast('Photo mise à jour !', 'success')
    refetch()
    setUploadOpen(false)
  }

  if (loading) return null

  const certifications = consultant?.certifications?.filter(c => c.type === 'Certification') ?? []
  const accreditations = consultant?.certifications?.filter(c => c.type === 'Accreditation') ?? []
  const missions = consultant?.missions ?? []

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-4 p-5 border-b border-slate-800">
          <Avatar consultant={consultant} size="lg" onClick={() => setUploadOpen(true)} />
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-xl text-white">{consultant?.prenom} {consultant?.nom}</h2>
            <p className="text-slate-400 text-sm">{consultant?.pays}</p>
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span><span className="text-brand-400 font-bold text-sm">{certifications.filter(c => c.statut === 'Obtenue').length}</span> certif.</span>
              <span><span className="text-gold-400 font-bold text-sm">{accreditations.filter(c => c.statut === 'Obtenue').length}</span> accréditations</span>
            </div>
          </div>
          <button onClick={() => setEditOpen(true)} title="Modifier le consultant" className="text-slate-500 hover:text-white p-1"><Edit2 size={18} /></button>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1"><X size={20} /></button>
        </div>

        <div className="flex-1 p-5 space-y-6">
          {/* Missions */}
          {missions.length > 0 && (
            <div>
              <div className="section-title">Projets actuels</div>
              <div className="flex flex-wrap gap-2">
                {missions.map(m => (
                  <span key={m.id} className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full">
                    {m.projets?.nom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="section-title mb-0">Certifications</div>
              <button onClick={() => setAddCertOpen(true)} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                <Plus size={12} /> Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {certifications.length === 0 && <p className="text-slate-500 text-sm">Aucune certification.</p>}
              {certifications.map(cert => (
                <CertRow key={cert.id} cert={cert}
                  onVoucher={() => handleDemanderVoucher(cert.id)}
                  onDelete={() => handleDeleteCert(cert.id)} />
              ))}
            </div>
          </div>

          {/* Accréditations */}
          {accreditations.length > 0 && (
            <div>
              <div className="section-title">Accréditations</div>
              <div className="space-y-2">
                {accreditations.map(cert => (
                  <CertRow key={cert.id} cert={cert}
                    onVoucher={() => handleDemanderVoucher(cert.id)}
                    onDelete={() => handleDeleteCert(cert.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modale ajout certification */}
      {addCertOpen && consultant && (
        <AjouterCertificationModal
          consultantId={consultant.id}
          consultantNom={`${consultant.prenom} ${consultant.nom}`}
          onClose={() => setAddCertOpen(false)}
          onAdded={() => { setAddCertOpen(false); refetch(); showToast('Certification ajoutée !', 'success') }}
        />
      )}

      {/* Modale édition consultant */}
      {editOpen && consultant && (
        <AjouterConsultantModal
          consultant={consultant}
          consultants={toutesLesPersonnes ?? []}
          onClose={() => setEditOpen(false)}
          onAdded={() => { setEditOpen(false); refetch(); onUpdated(); showToast('Consultant mis à jour !', 'success') }}
        />
      )}

      {/* Modale upload photo */}
      {uploadOpen && (
        <Modal title="Photo de profil" onClose={() => setUploadOpen(false)}>
          <p className="text-sm text-slate-400 mb-4">Choisis une photo (JPG, PNG, max 2 Mo).</p>
          <input type="file" accept="image/*" className="input" onChange={handlePhotoUpload} />
          <button onClick={() => setUploadOpen(false)} className="btn-ghost w-full mt-3">Passer cette étape</button>
        </Modal>
      )}
    </>
  )
}

function CertRow({ cert, onVoucher, onDelete }) {
  const peutDemanderVoucher = ['Planifiée', 'À retenter'].includes(cert.statut)
  return (
    <div className="card p-3 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{cert.nom_certification}</div>
          <div className="flex items-center gap-2 mt-1">
            <StatutBadge statut={cert.statut} />
            {cert.statut === 'Planifiée' && cert.date_previsionnelle && (
              <span className="text-xs text-slate-500">le {formatDate(cert.date_previsionnelle)}</span>
            )}
            {cert.statut === 'Obtenue' && cert.date_obtention && (
              <span className="text-xs text-slate-500">le {formatDate(cert.date_obtention)}</span>
            )}
          </div>
          {cert.vouchers?.code && (
            <div className="mt-1 text-xs text-emerald-400 font-mono">Voucher : {cert.vouchers.code}</div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {peutDemanderVoucher && (
            <button onClick={onVoucher} title="Demander un voucher"
              className="p-1.5 text-slate-500 hover:text-brand-400 transition-colors">
              <Ticket size={14} />
            </button>
          )}
          <button onClick={onDelete} title="Supprimer"
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
