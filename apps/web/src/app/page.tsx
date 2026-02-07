import { redirect } from 'next/navigation'
import { getSession } from '~/lib/auth/server'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await getSession()
  if (!session) {
    redirect('/accueil')
  } else {
    redirect('/tableaux-de-bord')
  }
}
