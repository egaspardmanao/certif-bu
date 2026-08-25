import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useClassement() {
  const [consultants, setConsultants] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('classement')  // vue SQL
      .select('*')
    // Charger aussi les certifications pour chaque consultant
    if (data) {
      const ids = data.map(c => c.id)
      const { data: certs } = await supabase
        .from('certifications')
        .select('*')
        .in('consultant_id', ids)
        .order('date_obtention', { ascending: false })
      const certsById = {}
      certs?.forEach(c => {
        if (!certsById[c.consultant_id]) certsById[c.consultant_id] = []
        certsById[c.consultant_id].push(c)
      })
      setConsultants(data.map(c => ({ ...c, certifications: certsById[c.id] ?? [] })))
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { consultants, loading, refetch: fetch }
}

// Tous les consultants actifs, y compris ceux masqués du classement (hide_for_community = true).
// Utilisé pour les pickers Manager/Responsable, qui doivent pouvoir référencer des managers
// ou responsables masqués du classement collectif (équivalent getToutesLesPersonnes()).
export function useToutesLesPersonnes() {
  const [personnes, setPersonnes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('consultants')
      .select('id, prenom, nom')
      .eq('actif', true)
      .order('nom')
    setPersonnes(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { personnes, loading, refetch: fetch }
}

export function useConsultant(id) {
  const [consultant, setConsultant] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const [{ data: c }, { data: certs }, { data: missions }] = await Promise.all([
      supabase.from('consultants').select('*').eq('id', id).single(),
      supabase.from('certifications').select('*, vouchers(code)').eq('consultant_id', id).order('statut'),
      supabase.from('missions').select('*, projets(id, nom)').eq('consultant_id', id),
    ])
    setConsultant(c ? { ...c, certifications: certs ?? [], missions: missions ?? [] } : null)
    setLoading(false)
  }, [id])

  useEffect(() => { fetch() }, [fetch])
  return { consultant, loading, refetch: fetch }
}
