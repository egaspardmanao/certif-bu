import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Award } from 'lucide-react'

export default function Login() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const { error } = await signInWithEmail(email)
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mb-4">
            <Award size={28} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-slate-900">Portail Certifications</h1>
          <p className="text-slate-500 text-sm mt-1">BU Salesforce</p>
        </div>

        {sent ? (
          <div className="card p-6 text-center">
            <div className="text-3xl mb-3">📬</div>
            <h2 className="font-semibold text-slate-900 mb-2">Vérifie ta boîte mail</h2>
            <p className="text-sm text-slate-500">
              Un lien de connexion a été envoyé à <strong className="text-slate-900">{email}</strong>.
              Clique dessus pour accéder au portail.
            </p>
            <button onClick={() => setSent(false)} className="mt-4 text-xs text-slate-500 hover:text-slate-900">
              Changer d'adresse
            </button>
          </div>
        ) : (
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-1">Connexion</h2>
            <p className="text-sm text-slate-500 mb-5">
              Saisis ton email Inetum pour recevoir un lien de connexion.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Adresse email</label>
                <input className="input" type="email" placeholder="prenom.nom@inetum.com"
                  value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                  autoFocus required />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Envoi en cours…' : 'Envoyer le lien de connexion'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
