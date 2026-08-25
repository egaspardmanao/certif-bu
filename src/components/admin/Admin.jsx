import { useState } from 'react'
import { Mail, Award, Ticket } from 'lucide-react'
import { useIsAdmin } from '../../hooks/useIsAdmin'
import { useToast } from '../shared/Toast'
import Toast from '../shared/Toast'
import EmailSettingsPanel from './EmailSettingsPanel'
import NomCertificationsPanel from './NomCertificationsPanel'
import VouchersPanel from './VouchersPanel'

const SOUS_ONGLETS = [
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'vouchers', label: 'Vouchers', icon: Ticket },
]

export default function Admin() {
  const isAdmin = useIsAdmin()
  const [sousOnglet, setSousOnglet] = useState('emails')
  const { toast, show, hide } = useToast()

  if (!isAdmin) {
    return <div className="card p-8 text-center text-slate-500">Accès réservé aux administrateurs.</div>
  }

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b border-slate-800">
        {SOUS_ONGLETS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSousOnglet(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
              sousOnglet === id ? 'border-brand-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {sousOnglet === 'emails' && <EmailSettingsPanel showToast={show} />}
      {sousOnglet === 'certifications' && <NomCertificationsPanel showToast={show} />}
      {sousOnglet === 'vouchers' && <VouchersPanel showToast={show} />}

      {toast && <Toast {...toast} onClose={hide} />}
    </div>
  )
}
