import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { TerritoiresVoisinsPage } from '~/components/territoires-voisins/territoires-voisins-page'
import { authOptions } from '~/lib/auth/auth.config'
import { TSession } from '~/types/next-auth'

export const metadata: Metadata = {
  title: 'Territoires voisins - Otelo',
}

export default async function TerritoiresVoisins() {
  const session = (await getServerSession(authOptions)) as TSession

  if (session.user.role !== 'ADMIN') {
    const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/epci-neighbors/access-check`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok || !(await res.json()).hasAccess) {
      redirect('/accueil')
    }
  }

  return <TerritoiresVoisinsPage />
}
