import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useProjets() {
  const [projets, setProjets] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('projets')
      .select('*, responsable:responsable_id(id, prenom, nom), missions(id, consultant_id, statut, consultant:consultant_id(id, prenom, nom, photo_url))')
      .eq('actif', true)
      .order('nom')
    setProjets(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { projets, loading, refetch: fetch }
}
