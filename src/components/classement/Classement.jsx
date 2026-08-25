import { useState, useMemo } from 'react'
import { Search, Plus, Trophy, ArrowUpDown } from 'lucide-react'
import { useClassement, useToutesLesPersonnes } from '../../hooks/useClassement'
import Avatar from '../shared/Avatar'
import PanneauConsultant from './PanneauConsultant'
import AjouterConsultantModal from './AjouterConsultantModal'
import { useToast } from '../shared/Toast'
import Toast from '../shared/Toast'

function Podium({ top3 }) {
  if (top3.length < 1) return null
  const [first, second, third] = top3
  const steps = [
    { consultant: second, place: 2, height: 'h-24', color: 'bg-slate-600', medal: '🥈' },
    { consultant: first,  place: 1, height: 'h-36', color: 'bg-gold-500',  medal: '🥇' },
    { consultant: third,  place: 3, height: 'h-16', color: 'bg-orange-700', medal: '🥉' },
  ]
  return (
    <div className="flex items-end justify-center gap-2 mb-8 pt-4">
      {steps.map(({ consultant, place, height, color, medal }) => consultant && (
        <div key={place} className="flex flex-col items-center gap-2">
          <Avatar consultant={consultant} size="lg" />
          <div className="text-center">
            <div className="text-sm font-semibold text-white">{consultant.prenom}</div>
            <div className="text-xs text-slate-400">{consultant.nb_certifications} certif.</div>
          </div>
          <div className={`${height} ${color} podium-bar w-20 rounded-t-lg flex items-start justify-center pt-2 text-xl`}>
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
    <th className="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white select-none"
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

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Chargement…</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-10">#</th>
                  <SortBtn field="nom" label="Consultant" />
                  <SortBtn field="nb_certifications" label="Certifications" />
                  <SortBtn field="prochaine_planifiee" label="Planifiée" />
                  <SortBtn field="derniere_obtention" label="Dernière obtention" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.slice(0, 50).map((c, i) => (
                  <tr key={c.id} onClick={() => setSelected(c.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors">
                    <td className="px-3 py-2.5 text-slate-500 text-xs">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar consultant={c} size="sm" />
                        <span className="font-medium text-white">{c.prenom} {c.nom}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-brand-400">{c.nb_certifications}</td>
                    <td className="px-3 py-2.5 text-slate-400 text-xs">{c.prochaine_planifiee ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-400 text-xs">{c.derniere_obtention ?? '—'}</td>
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

      {/* Panneau détail consultant */}
      {selected && (
        <PanneauConsultant
          consultantId={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => { refetch(); show('Mis à jour !', 'success') }}
          showToast={show}
          toutesLesPersonnes={toutesLesPersonnes}
        />
      )}

      {/* Modale ajout consultant */}
      {addOpen && (
        <AjouterConsultantModal
          consultants={toutesLesPersonnes}
          onClose={() => setAddOpen(false)}
          onAdded={() => { setAddOpen(false); refetch(); show('Consultant ajouté !', 'success') }}
        />
      )}

      {toast && <Toast {...toast} onClose={hide} />}
    </div>
  )
}
