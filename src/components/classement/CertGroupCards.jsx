import { useState, useMemo } from 'react'
import { buildCertGroups, formatDate } from '../../lib/utils'
import Modal from '../shared/Modal'

function CardsSection({ title, groups }) {
  if (groups.length === 0) return null
  return (
    <div>
      <div className="section-title">{title}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {groups.map(g => (
          <button key={g.nom} onClick={g.onClick}
            className="card p-3 text-left hover:border-brand-500/50 transition-colors">
            <div className="text-sm font-medium text-slate-900 line-clamp-2">{g.nom}</div>
            <div className="text-xs text-brand-400 font-bold mt-1">{g.countLabel}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function CertGroupCards({ consultants }) {
  const [detail, setDetail] = useState(null)

  const certifications = useMemo(() => buildCertGroups(consultants, 'Certification'), [consultants])
  const accreditations = useMemo(() => buildCertGroups(consultants, 'Accreditation'), [consultants])

  const withClick = groups => groups.map(g => ({ ...g, onClick: () => setDetail(g) }))

  return (
    <div className="space-y-6 mt-8">
      <CardsSection title="Certifications" groups={withClick(certifications)} />
      <CardsSection title="Accréditations" groups={withClick(accreditations)} />

      {detail && (
        <Modal title={detail.nom} onClose={() => setDetail(null)}>
          <div className="space-y-2">
            {detail.holders.map(h => (
              <div key={h.consultant.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-900">{h.consultant.prenom} {h.consultant.nom}</span>
                {h.date_obtention && <span className="text-slate-500 text-xs">{formatDate(h.date_obtention)}</span>}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
