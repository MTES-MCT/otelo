import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (!session || session.error) {
    redirect('/accueil')
  } else {
    redirect('/tableaux-de-bord')
  }
}
