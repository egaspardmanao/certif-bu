import { useEffect, useState } from 'react'
import { useAuth } from './useAuth.jsx'
import { supabase } from '../lib/supabase'

// Un consultant admin (staff BU) peut supprimer un projet, cf. schema.sql (is_current_user_admin()).
// Appelle directement la fonction SQL plutôt que de dupliquer sa logique côté client :
// elle seule fait foi (source unique de vérité), y compris pour les policies RLS.
export function useIsAdmin() {
  const { session } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!session?.user?.email) { setIsAdmin(false); return }
    supabase.rpc('is_current_user_admin')
      .then(({ data }) => setIsAdmin(data === true))
  }, [session?.user?.email])

  return isAdmin
}
