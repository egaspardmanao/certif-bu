import { useEffect, useState } from 'react'
import { useAuth } from './useAuth.jsx'
import { supabase } from '../lib/supabase'

// Un consultant admin (staff BU) peut supprimer un projet, cf. schema.sql (is_current_user_admin()).
export function useIsAdmin() {
  const { session } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!session?.user?.email) { setIsAdmin(false); return }
    if (session.user.email === 'etiennegaspard08@gmail.com') { setIsAdmin(true); return }
    supabase.from('consultants').select('is_admin').eq('email', session.user.email).maybeSingle()
      .then(({ data }) => setIsAdmin(data?.is_admin === true))
  }, [session?.user?.email])

  return isAdmin
}
