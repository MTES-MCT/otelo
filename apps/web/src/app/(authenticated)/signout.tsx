'use client'

import { signOut, useSession } from 'next-auth/react'
import { useEffect } from 'react'

export const handleSignOut = async () => {
  try {
    await fetch('/api/auth/sign-out')

    await signOut({ callbackUrl: '/accueil', redirect: true })
  } catch {
    await signOut({ callbackUrl: '/accueil', redirect: true })
  }
}

export const Signout = () => {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.error) {
      handleSignOut()
    }
  }, [session])

  return null
}
