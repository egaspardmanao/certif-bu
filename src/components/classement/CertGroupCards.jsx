import { useState, useMemo } from 'react'
import { Award, Medal } from 'lucide-react'
import { buildCertGroups, formatDate } from '../../lib/utils'
import Modal from '../shared/Modal'
import Avatar from '../shared/Avatar'

function CardsSection({ title, groups, icon: Icon, accent }) {
  if (groups.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className={accent.icon} />
        <div className="section-title mb-0 border-none pb-0">{title}</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {groups.map(g => (
          <button key={g.nom} onClick={g.onClick}
            className={`card p-4 text-left border-t-4 ${accent.border} hover:shadow-md hover:-translate-y-0.5 transition-all`}>
            <div className="text-sm font-medium text-slate-900 line-clamp-2 min-h-[2.5em]">{g.nom}</div>
            <div className={`text-xs font-bold mt-2 ${accent.text}`}>{g.countLabel}</div>
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
    <div className="space-y-8 mt-10">
      <CardsSection title="Certifications" icon={Award} accent={{ border: 'border-t-brand-600', text: 'text-brand-600', icon: 'text-brand-600' }}
        groups={withClick(certifications)} />
      <CardsSection title="Accréditations" icon={Medal} accent={{ border: 'border-t-gold-500', text: 'text-gold-500', icon: 'text-gold-500' }}
        groups={withClick(accreditations)} />

      {detail && (
        <Modal title={detail.nom} onClose={() => setDetail(null)}>
          <div className="space-y-1">
            {detail.holders.map(h => (
              <div key={h.consultant.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <Avatar consultant={h.consultant} size="sm" />
                <span className="flex-1 text-sm font-medium text-slate-900">{h.consultant.prenom} {h.consultant.nom}</span>
                {h.date_obtention && <span className="text-slate-500 text-xs">{formatDate(h.date_obtention)}</span>}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
