import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { VOUCHER_STATUTS } from '../../lib/constants'
import { formatDate } from '../../lib/utils'

export default function VouchersPanel({ showToast }) {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ code: '', date_debut_validite: '', date_fin_validite: '' })
  const [saving, setSaving] = useState(false)

  async function fetchVouchers() {
    setLoading(true)
    const { data } = await supabase
      .from('vouchers')
      .select('*, consultants(prenom, nom)')
      .order('created_at', { ascending: false })
    setVouchers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchVouchers() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.code.trim()) return
    setSaving(true)
    const { error } = await supabase.from('vouchers').insert({
      code: form.code.trim(),
      statut: 'Disponible',
      date_debut_validite: form.date_debut_validite || null,
      date_fin_validite: form.date_fin_validite || null,
    })
    setSaving(false)
    if (error) { showToast('Erreur : ' + error.message, 'error'); return }
    setForm({ code: '', date_debut_validite: '', date_fin_validite: '' })
    showToast('Voucher créé.', 'success')
    fetchVouchers()
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="card p-4 mb-4 flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[160px]">
          <label className="label">Code voucher</label>
          <input className="input font-mono" value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value}))}
            placeholder="ex. SFL234680B3D" required />
        </div>
        <div>
          <label className="label">Validité du</label>
          <input className="input" type="date" value={form.date_debut_validite}
            onChange={e => setForm(f => ({...f, date_debut_validite: e.target.value}))} />
        </div>
        <div>
          <label className="label">Validité au</label>
          <input className="input" type="date" value={form.date_fin_validite}
            onChange={e => setForm(f => ({...f, date_fin_validite: e.target.value}))} />
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
          <Plus size={14} /> Créer
        </button>
      </form>

      {loading ? (
        <div className="text-slate-500 text-sm">Chargement…</div>
      ) : (
        <div className="card divide-y divide-slate-800">
          {vouchers.length === 0 && <div className="p-4 text-slate-500 text-sm text-center">Aucun voucher.</div>}
          {vouchers.map(v => (
            <div key={v.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div>
                <span className="font-mono text-white">{v.code}</span>
                {v.consultants && (
                  <span className="ml-2 text-xs text-slate-500">→ {v.consultants.prenom} {v.consultants.nom}</span>
                )}
                {(v.date_debut_validite || v.date_fin_validite) && (
                  <span className="ml-2 text-xs text-slate-500">
                    ({v.date_debut_validite ? formatDate(v.date_debut_validite) : '…'} – {v.date_fin_validite ? formatDate(v.date_fin_validite) : '…'})
                  </span>
                )}
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full ${VOUCHER_STATUTS[v.statut]?.color ?? ''}`}>
                {v.statut}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
