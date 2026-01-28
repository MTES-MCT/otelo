import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'
import { TEpci } from '@shared'

export const getBassinEpcis = async (epci: string) => {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/epcis/${epci}/bassin`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    return []
  }
  return (await res.json()) as TEpci[]
}
