import { CERT_STATUTS } from '../../lib/constants'
import { isAccreditation } from '../../lib/utils'

export function StatutBadge({ statut }) {
  const s = CERT_STATUTS[statut] ?? {}
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${s.color ?? 'bg-slate-800 text-slate-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot ?? 'bg-slate-500'}`} />
      {statut}
    </span>
  )
}

export function TypeBadge({ nom }) {
  return isAccreditation(nom)
    ? <span className="badge-accred">Accréditation</span>
    : <span className="badge-cert">Certification</span>
}
