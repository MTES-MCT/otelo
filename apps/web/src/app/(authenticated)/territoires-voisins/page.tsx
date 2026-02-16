import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TerritoiresVoisinsPage } from '~/components/territoires-voisins/territoires-voisins-page'
import { getSession } from '~/lib/auth/server'

export const metadata: Metadata = {
  title: 'Territoires voisins - Otelo',
}

export const dynamic = 'force-dynamic'

export default async function TerritoiresVoisins() {
  const session = await getSession()
  const cookieStore = await cookies()

  if (!session) {
    redirect('/connexion')
  }

  if (session.user.role !== 'ADMIN') {
    const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/epci-neighbors/access-check`, {
      headers: {
        cookie: cookieStore.toString(),
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok || !(await res.json()).hasAccess) {
      redirect('/accueil')
    }
  }

  return <TerritoiresVoisinsPage />
}
