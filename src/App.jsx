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
      <header className="sticky top-0 z-30 shadow-sm">
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-transparent" />
          <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-center relative">
            <div className="flex items-center gap-3">
              <span className="text-4xl leading-none drop-shadow">🏆</span>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-white leading-none tracking-tight">BU Salesforce Inetum</h1>
            </div>
            <div className="absolute right-4 flex items-center gap-3">
              <span className="text-brand-100 text-xs hidden sm:block">{session.user.email}</span>
              <button onClick={signOut} className="text-sm flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors">
                <LogOut size={14} /> Déconnexion
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex overflow-x-auto justify-center">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.short}</span>
                </button>
              ))}
            </div>
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
