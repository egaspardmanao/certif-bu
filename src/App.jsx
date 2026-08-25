import { useState } from 'react'
import { Award, LogOut } from 'lucide-react'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import Login from './components/auth/Login'
import Classement from './components/classement/Classement'
import CertifiesDuMois from './components/certifies/CertifiesDuMois'
import Ressources from './components/ressources/Ressources'
import Projets from './components/projets/Projets'

const TABS = [
  { id: 'classement', label: '🏅 Classement & Podium', short: 'Classement' },
  { id: 'certifies',  label: '⭐ Certifiés du mois',   short: 'Du mois' },
  { id: 'ressources', label: '📚 Ressources utiles',    short: 'Ressources' },
  { id: 'projets',    label: '📁 Projets de la BU',     short: 'Projets' },
]

function PortailInner() {
  const { session, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('classement')

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-500 text-sm">Chargement…</div>
    </div>
  )

  if (!session) return <Login />

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Award size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-white leading-none">Certifications BU</h1>
              <p className="text-slate-500 text-xs">Portail Salesforce Inetum</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-xs hidden sm:block">{session.user.email}</span>
            <button onClick={signOut} className="btn-ghost text-sm flex items-center gap-1.5 py-1.5 px-3">
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex border-b border-slate-800 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.short}</span>
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {activeTab === 'classement' && <Classement />}
        {activeTab === 'certifies'  && <CertifiesDuMois />}
        {activeTab === 'ressources' && <Ressources />}
        {activeTab === 'projets'    && <Projets />}
      </main>
    </div>
  )
}

export default function App() {
  return <AuthProvider><PortailInner /></AuthProvider>
}
