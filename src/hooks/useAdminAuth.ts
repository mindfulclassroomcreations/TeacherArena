import { useEffect, useState } from 'react'

const STORAGE_KEY = 'ta_admin_key'

export function useAdminAuth() {
  const [isAuthed, setIsAuthed] = useState<boolean>(false)
  const [ready, setReady] = useState<boolean>(false)
  const adminKey = (process.env.NEXT_PUBLIC_ADMIN_KEY ?? '').trim()
  const configured = adminKey.length > 0

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      setIsAuthed(Boolean(saved) && configured && saved === adminKey)
    } finally {
      setReady(true)
    }
  }, [adminKey, configured])

  const login = (key: string) => {
    if (typeof window === 'undefined') return false
    if (!configured) return false
    const ok = Boolean(key) && key === adminKey
    if (ok) {
      window.localStorage.setItem(STORAGE_KEY, key)
      setIsAuthed(true)
    }
    return ok
  }

  const logout = () => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(STORAGE_KEY)
    setIsAuthed(false)
  }

  return { isAuthed, ready, configured, login, logout }
}
