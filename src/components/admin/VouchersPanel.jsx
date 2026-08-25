import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Upload, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { VOUCHER_STATUTS } from '../../lib/constants'
import { formatDate } from '../../lib/utils'

const CSV_TEMPLATE = 'code,date_debut_validite,date_fin_validite\nSFL234680B3D,2026-01-01,2026-12-31\n'

// Parseur CSV minimal : une valeur par cellule, pas de virgule/guillemet imbriqué à gérer
// pour ce cas d'usage (code voucher + 2 dates ISO).
function parseCsv(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  const idxCode = header.indexOf('code')
  if (idxCode === -1) throw new Error('Colonne "code" manquante dans le CSV.')
  const idxDebut = header.indexOf('date_debut_validite')
  const idxFin   = header.indexOf('date_fin_validite')
  return lines.slice(1).map(line => {
    const cells = line.split(',').map(c => c.trim())
    return {
      code: cells[idxCode],
      date_debut_validite: idxDebut !== -1 ? (cells[idxDebut] || null) : null,
      date_fin_validite:   idxFin   !== -1 ? (cells[idxFin]   || null) : null,
    }
  }).filter(row => row.code)
}

export default function VouchersPanel({ showToast }) {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ code: '', date_debut_validite: '', date_fin_validite: '' })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const [consultantsList, setConsultantsList] = useState([])
  const [certsDuConsultant, setCertsDuConsultant] = useState([])
  const [attribuerConsultantId, setAttribuerConsultantId] = useState('')
  const [attribuerCertId, setAttribuerCertId] = useState('')
  const [attribuant, setAttribuant] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

  async function fetchVouchers() {
    setLoading(true)
    const { data } = await supabase
      .from('vouchers')
      .select('*, consultants(prenom, nom)')
      .order('created_at', { ascending: false })
    setVouchers(data ?? [])
    setLoading(false)
  }

  async function fetchConsultantsList() {
    const { data } = await supabase.from('consultants').select('id, prenom, nom').eq('actif', true).order('nom')
    setConsultantsList(data ?? [])
  }

  async function fetchCertsDuConsultant(consultantId) {
    if (!consultantId) { setCertsDuConsultant([]); return }
    const { data } = await supabase
      .from('certifications')
      .select('id, nom_certification, statut, voucher_id')
      .eq('consultant_id', consultantId)
      .order('nom_certification')
    setCertsDuConsultant(data ?? [])
  }

  useEffect(() => { fetchVouchers(); fetchConsultantsList() }, [])

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

  function handleDownloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_vouchers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportCsv(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length === 0) { showToast('Aucune ligne valide dans le CSV.', 'error'); return }
      const { data, error } = await supabase.from('vouchers')
        .insert(rows.map(r => ({ ...r, statut: 'Disponible' })))
        .select('id')
      if (error) { showToast('Erreur import : ' + error.message, 'error'); return }
      showToast(`${data.length} voucher(s) importé(s).`, 'success')
      fetchVouchers()
    } catch (err) {
      showToast('Erreur import : ' + err.message, 'error')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function startEdit(v) {
    setEditingId(v.id)
    setEditForm({
      code: v.code,
      statut: v.statut,
      date_debut_validite: v.date_debut_validite ?? '',
      date_fin_validite: v.date_fin_validite ?? '',
    })
    setAttribuerConsultantId('')
    setAttribuerCertId('')
    setCertsDuConsultant([])
  }

  function handleAttribuerConsultantChange(consultantId) {
    setAttribuerConsultantId(consultantId)
    setAttribuerCertId('')
    fetchCertsDuConsultant(consultantId)
  }

  async function handleAttribuer(voucherId) {
    if (!attribuerCertId) return
    setAttribuant(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/voucher/attribuer-manuel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ voucherId, certificationId: attribuerCertId }),
    })
    setAttribuant(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast('Erreur : ' + (d.error ?? 'inconnue'), 'error'); return }
    setEditingId(null)
    showToast('Voucher attribué.', 'success')
    fetchVouchers()
  }

  async function handleSaveEdit(id) {
    const { error } = await supabase.from('vouchers').update({
      code: editForm.code.trim(),
      statut: editForm.statut,
      date_debut_validite: editForm.date_debut_validite || null,
      date_fin_validite: editForm.date_fin_validite || null,
    }).eq('id', id)
    if (error) { showToast('Erreur : ' + error.message, 'error'); return }
    setEditingId(null)
    showToast('Voucher mis à jour.', 'success')
    fetchVouchers()
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce voucher ?')) return
    const { error } = await supabase.from('vouchers').delete().eq('id', id)
    if (error) { showToast('Erreur : ' + error.message, 'error'); return }
    showToast('Voucher supprimé.', 'info')
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

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={handleDownloadTemplate} className="btn-ghost text-sm flex items-center gap-2 py-1.5 px-3">
          <Download size={14} /> Télécharger le template CSV
        </button>
        <button onClick={() => fileInputRef.current?.click()} disabled={importing}
          className="btn-ghost text-sm flex items-center gap-2 py-1.5 px-3 disabled:opacity-50">
          <Upload size={14} /> {importing ? 'Import…' : 'Importer un CSV'}
        </button>
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCsv} />
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Chargement…</div>
      ) : (
        <div className="card divide-y divide-slate-200">
          {vouchers.length === 0 && <div className="p-4 text-slate-500 text-sm text-center">Aucun voucher.</div>}
          {vouchers.map(v => editingId === v.id ? (
            <div key={v.id} className="px-4 py-2.5 space-y-2">
              <div className="flex items-end gap-2 flex-wrap">
                <input className="input font-mono flex-1 min-w-[140px]" value={editForm.code}
                  onChange={e => setEditForm(f => ({...f, code: e.target.value}))} />
                <select className="input w-auto" value={editForm.statut}
                  onChange={e => setEditForm(f => ({...f, statut: e.target.value}))}>
                  {Object.keys(VOUCHER_STATUTS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className="input w-auto" type="date" value={editForm.date_debut_validite}
                  onChange={e => setEditForm(f => ({...f, date_debut_validite: e.target.value}))} />
                <input className="input w-auto" type="date" value={editForm.date_fin_validite}
                  onChange={e => setEditForm(f => ({...f, date_fin_validite: e.target.value}))} />
                <button onClick={() => handleSaveEdit(v.id)} className="p-2 text-emerald-600 hover:text-emerald-700"><Check size={16} /></button>
                <button onClick={() => setEditingId(null)} className="p-2 text-slate-500 hover:text-slate-900"><X size={16} /></button>
              </div>
              <div className="flex items-center gap-2 flex-wrap border-t border-slate-200 pt-2">
                <label className="label mb-0 shrink-0">Attribuer à</label>
                <select className="input flex-1 min-w-[180px]" value={attribuerConsultantId}
                  onChange={e => handleAttribuerConsultantChange(e.target.value)}>
                  <option value="">— Choisir un consultant —</option>
                  {consultantsList.map(c => (
                    <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                  ))}
                </select>
                <select className="input flex-1 min-w-[220px]" value={attribuerCertId}
                  disabled={!attribuerConsultantId}
                  onChange={e => setAttribuerCertId(e.target.value)}>
                  <option value="">
                    {attribuerConsultantId
                      ? (certsDuConsultant.length ? '— Choisir une certification —' : 'Aucune certification disponible')
                      : '— Choisir un consultant d\'abord —'}
                  </option>
                  {certsDuConsultant.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom_certification} ({c.statut}){c.voucher_id ? ' — a déjà un voucher !' : ''}
                    </option>
                  ))}
                </select>
                <button onClick={() => handleAttribuer(v.id)} disabled={!attribuerCertId || attribuant}
                  className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50">
                  {attribuant ? 'Attribution…' : 'Attribuer'}
                </button>
              </div>
            </div>
          ) : (
            <div key={v.id} className="flex items-center justify-between px-4 py-2.5 text-sm group">
              <div>
                <span className="font-mono text-slate-900">{v.code}</span>
                {v.consultants && (
                  <span className="ml-2 text-xs text-slate-500">→ {v.consultants.prenom} {v.consultants.nom}</span>
                )}
                {(v.date_debut_validite || v.date_fin_validite) && (
                  <span className="ml-2 text-xs text-slate-500">
                    ({v.date_debut_validite ? formatDate(v.date_debut_validite) : '…'} – {v.date_fin_validite ? formatDate(v.date_fin_validite) : '…'})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full ${VOUCHER_STATUTS[v.statut]?.color ?? ''}`}>
                  {v.statut}
                </span>
                <button onClick={() => startEdit(v)} className="p-1 text-slate-400 hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity"><Pencil size={13} /></button>
                <button onClick={() => handleDelete(v.id)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
