import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { TerritoiresVoisinsPage } from '~/components/territoires-voisins/territoires-voisins-page'
import { authFetch, getSession } from '~/lib/auth/server'

export const metadata: Metadata = {
  title: 'Territoires voisins - Otelo',
}

export const dynamic = 'force-dynamic'

export default async function TerritoiresVoisins() {
  const session = await getSession()

  if (!session) {
    redirect('/connexion')
  }

  if (session.user.role !== 'ADMIN') {
    const res = await authFetch('/epci-neighbors/access-check')

    if (!res.ok || !(await res.json()).hasAccess) {
      redirect('/accueil')
    }
  }

  return <TerritoiresVoisinsPage />
}
