import { useState, useMemo } from 'react'
import { Search, Plus, Trophy, ArrowUpDown } from 'lucide-react'
import { useClassement, useToutesLesPersonnes } from '../../hooks/useClassement'
import Avatar from '../shared/Avatar'
import PanneauConsultant from './PanneauConsultant'
import AjouterConsultantModal from './AjouterConsultantModal'
import CertGroupCards from './CertGroupCards'
import { useToast } from '../shared/Toast'
import Toast from '../shared/Toast'
import { formatDate } from '../../lib/utils'

function Podium({ top3 }) {
  if (top3.length < 1) return null
  const [first, second, third] = top3
  const steps = [
    { consultant: second, place: 2, height: 'h-20', gradient: 'from-slate-300 to-slate-400', ring: 'ring-slate-300', medal: '🥈' },
    { consultant: first,  place: 1, height: 'h-28', gradient: 'from-yellow-400 to-amber-500', ring: 'ring-amber-400', medal: '🥇' },
    { consultant: third,  place: 3, height: 'h-14', gradient: 'from-orange-500 to-orange-700', ring: 'ring-orange-500', medal: '🥉' },
  ]
  return (
    <div className="flex items-end justify-center gap-3 mb-8 pt-4">
      {steps.map(({ consultant, place, height, gradient, ring, medal }) => consultant && (
        <div key={place} className="flex flex-col items-center gap-2">
          <div className={`rounded-full ring-4 ${ring} ring-offset-2 ring-offset-slate-50`}>
            <Avatar consultant={consultant} size="lg" />
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-slate-900">{consultant.prenom}</div>
            <div className="text-xs text-slate-500">{consultant.nb_certifications} certif.</div>
          </div>
          <div className={`${height} w-24 rounded-t-xl bg-gradient-to-b ${gradient} shadow-md flex items-start justify-center pt-3 text-2xl podium-bar`}>
            {medal}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Classement() {
  const { consultants, loading, refetch } = useClassement()
  const { personnes: toutesLesPersonnes } = useToutesLesPersonnes()
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('nb_certifications')
  const [sortAsc, setSortAsc]     = useState(false)
  const [selected, setSelected]   = useState(null)
  const [openPhotoStep, setOpenPhotoStep] = useState(false)
  const [addOpen, setAddOpen]     = useState(false)
  const { toast, show, hide }     = useToast()

  const filtered = useMemo(() => {
    let list = consultants.filter(c =>
      `${c.prenom} ${c.nom}`.toLowerCase().includes(search.toLowerCase())
    )
    list.sort((a, b) => {
      const va = a[sortField] ?? ''
      const vb = b[sortField] ?? ''
      return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })
    return list
  }, [consultants, search, sortField, sortAsc])

  const top3 = consultants.slice(0, 3)

  function handleSort(field) {
    if (sortField === field) setSortAsc(a => !a)
    else { setSortField(field); setSortAsc(false) }
  }

  const SortBtn = ({ field, label }) => (
    <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-900 select-none"
      onClick={() => handleSort(field)}>
      <span className="flex items-center gap-1">{label}<ArrowUpDown size={12} /></span>
    </th>
  )

  return (
    <div className="relative">
      {/* Podium */}
      <Podium top3={top3} />

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-9" placeholder="Rechercher un consultant…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> Ajouter un consultant
        </button>
      </div>

      {/* Tri (mobile uniquement : les en-têtes du tableau sont trop petits pour être tapés au doigt) */}
      <div className="flex sm:hidden items-center gap-2 mb-3 text-xs">
        <span className="text-slate-500">Trier par</span>
        <button onClick={() => handleSort('nb_certifications')} className="btn-ghost px-2.5 py-1">
          Rang <ArrowUpDown size={11} className="inline ml-1" />
        </button>
        <button onClick={() => handleSort('nom')} className="btn-ghost px-2.5 py-1">
          Consultant <ArrowUpDown size={11} className="inline ml-1" />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Chargement…</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-10">#</th>
                  <SortBtn field="nom" label="Consultant" />
                  <SortBtn field="nb_certifications" label="Certifications" />
                  <SortBtn field="prochaine_planifiee" label="Planifiée" />
                  <SortBtn field="derniere_obtention" label="Dernière obtention" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {filtered.slice(0, 50).map((c, i) => (
                  <tr key={c.id} onClick={() => setSelected(c.id)}
                    className="hover:bg-slate-100/70 cursor-pointer transition-colors">
                    <td className="px-3 py-2.5 text-slate-500 text-xs">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar consultant={c} size="sm" />
                        <span className="font-medium text-slate-900">{c.prenom} {c.nom}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-brand-400">{c.nb_certifications}</td>
                    <td className="px-3 py-2.5 text-slate-500 text-xs">{c.prochaine_planifiee ? formatDate(c.prochaine_planifiee) : '—'}</td>
                    <td className="px-3 py-2.5 text-slate-500 text-xs">{c.derniere_obtention ? formatDate(c.derniere_obtention) : '—'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-12 text-center text-slate-500">Aucun consultant trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cartes titulaires par certification / accréditation */}
      {!loading && <CertGroupCards consultants={consultants} />}

      {/* Panneau détail consultant */}
      {selected && (
        <PanneauConsultant
          consultantId={selected}
          onClose={() => { setSelected(null); setOpenPhotoStep(false) }}
          onUpdated={() => { refetch(); show('Mis à jour !', 'success') }}
          showToast={show}
          toutesLesPersonnes={toutesLesPersonnes}
          openPhotoStep={openPhotoStep}
        />
      )}

      {/* Modale ajout consultant */}
      {addOpen && (
        <AjouterConsultantModal
          consultants={toutesLesPersonnes}
          onClose={() => setAddOpen(false)}
          onAdded={(newId) => {
            setAddOpen(false)
            refetch()
            show('Consultant ajouté !', 'success')
            if (newId) { setSelected(newId); setOpenPhotoStep(true) }
          }}
        />
      )}

      {toast && <Toast {...toast} onClose={hide} />}
    </div>
  )
}
