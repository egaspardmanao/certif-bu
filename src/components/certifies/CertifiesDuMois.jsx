import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Avatar from '../shared/Avatar'
import { StatutBadge, TypeBadge } from '../shared/Badge'
import { formatDate } from '../../lib/utils'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

const ACCENTS = {
  gold:   { border: 'border-l-gold-500',   heading: 'text-gold-500' },
  brand:  { border: 'border-l-brand-600',  heading: 'text-brand-600' },
  amber:  { border: 'border-l-amber-500',  heading: 'text-amber-600' },
}

function Section({ items, emptyMsg, accent = 'brand' }) {
  const a = ACCENTS[accent]
  if (items.length === 0) return (
    <div className="card p-6 text-center text-slate-500 text-sm">{emptyMsg}</div>
  )
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className={`card border-l-4 ${a.border} p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap`}>
          <Avatar consultant={{ prenom: item.prenom, nom: item.nom, photo_url: item.photo_url }} size="md" />
          <div className="flex-1 min-w-[140px]">
            <div className="font-semibold text-slate-900">{item.prenom} {item.nom}</div>
            <div className="text-sm text-slate-500 truncate">{item.nom_certification}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
            <StatutBadge statut={item.statut} />
            <TypeBadge type={item.type} />
            {item.date_obtention && (
              <span className="text-xs text-slate-500">{formatDate(item.date_obtention)}</span>
            )}
            {item.date_previsionnelle && item.statut !== 'Obtenue' && (
              <span className="text-xs text-slate-500">le {formatDate(item.date_previsionnelle)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CertifiesDuMois() {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('certifies_du_mois').select('*').order('date_obtention', { ascending: false })
      setData(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const now       = new Date()
  const moisActuel = { start: startOfMonth(now), end: endOfMonth(now) }
  const moisPrev   = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }

  const inRange = (d, range) => d && new Date(d) >= range.start && new Date(d) <= range.end

  const cettemois  = data.filter(c => c.statut === 'Obtenue' && inRange(c.date_obtention, moisActuel))
  const moisPasse  = data.filter(c => c.statut === 'Obtenue' && inRange(c.date_obtention, moisPrev))
  const enCours    = data.filter(c => ['Planifiée', 'À retenter'].includes(c.statut))

  const moisLabel = (d) => format(d, 'MMMM yyyy', { locale: fr })

  if (loading) return <div className="text-center py-16 text-slate-500">Chargement…</div>

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display font-bold text-lg text-gold-500 mb-3 capitalize">
          ⭐ Certifiés — {moisLabel(now)}
        </h3>
        <Section items={cettemois} emptyMsg="Aucune certification obtenue ce mois-ci (encore !)." accent="gold" />
      </div>
      <div>
        <h3 className="font-display font-bold text-lg text-brand-600 mb-3 capitalize">
          Certifiés — {moisLabel(subMonths(now, 1))}
        </h3>
        <Section items={moisPasse} emptyMsg="Aucune certification obtenue le mois précédent." accent="brand" />
      </div>
      <div>
        <h3 className="font-display font-bold text-lg text-amber-600 mb-3">
          🎯 En préparation ({enCours.length})
        </h3>
        <Section items={enCours} emptyMsg="Aucune certification en cours de préparation." accent="amber" />
      </div>
    </div>
  )
}
