import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { useIsAdmin } from './hooks/useIsAdmin'
import Login from './components/auth/Login'
import Classement from './components/classement/Classement'
import CertifiesDuMois from './components/certifies/CertifiesDuMois'
import Ressources from './components/ressources/Ressources'
import Projets from './components/projets/Projets'
import Admin from './components/admin/Admin'

const TABS = [
  { id: 'classement', label: '🏅 Classement & Podium', short: 'Classement' },
  { id: 'certifies',  label: '⭐ Certifiés du mois',   short: 'Du mois' },
  { id: 'ressources', label: '📚 Ressources utiles',    short: 'Ressources' },
  { id: 'projets',    label: '📁 Projets de la BU',     short: 'Projets' },
]

const ADMIN_TAB = { id: 'admin', label: '⚙️ Admin', short: 'Admin' }

function PortailInner() {
  const { session, loading, signOut } = useAuth()
  const isAdmin = useIsAdmin()
  const [activeTab, setActiveTab] = useState('classement')
  const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-500 text-sm">Chargement…</div>
    </div>
  )

  if (!session) return <Login />

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center relative">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <h1 className="font-display font-bold text-xl text-slate-900 leading-none">BU Salesforce Inetum</h1>
          </div>
          <div className="absolute right-4 flex items-center gap-3">
            <span className="text-slate-500 text-xs hidden sm:block">{session.user.email}</span>
            <button onClick={signOut} className="btn-ghost text-sm flex items-center gap-1.5 py-1.5 px-3">
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex border-b border-slate-200 overflow-x-auto justify-center">
            {tabs.map(tab => (
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
        {activeTab === 'admin'      && <Admin />}
      </main>
    </div>
  )
}

export default function App() {
  return <AuthProvider><PortailInner /></AuthProvider>
}
