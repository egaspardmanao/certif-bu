import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRessources(nomCertification) {
  const [ressources, setRessources] = useState([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!nomCertification) { setRessources([]); return }
    setLoading(true)
    const { data } = await supabase
      .from('ressources')
      .select('*')
      .eq('nom_certification', nomCertification)
      .order('created_at', { ascending: false })
    setRessources(data ?? [])
    setLoading(false)
  }, [nomCertification])

  useEffect(() => { fetch() }, [fetch])
  return { ressources, loading, refetch: fetch }
}

export function useNomCertifications() {
  const [noms, setNoms] = useState([])
  useEffect(() => {
    supabase.from('nom_certifications').select('*').eq('actif', true)
      .order('ordre').then(({ data }) => setNoms(data ?? []))
  }, [])
  return noms
}
