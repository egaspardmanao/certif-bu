import { CERT_STATUTS } from '../../lib/constants'

export function StatutBadge({ statut }) {
  const s = CERT_STATUTS[statut] ?? {}
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${s.color ?? 'bg-slate-800 text-slate-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot ?? 'bg-slate-500'}`} />
      {statut}
    </span>
  )
}

export function TypeBadge({ type }) {
  return type === 'Accreditation'
    ? <span className="badge-accred text-xs">Accréditation</span>
    : <span className="badge-cert text-xs">Certification</span>
}
