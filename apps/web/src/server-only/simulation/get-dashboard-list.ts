import { TEpci } from '@shared'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'
import { TSimulationWithRelations } from '~/schemas/simulation'

export const getDashboardList = async () => {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    notFound()
  }

  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/simulations/dashboard-list`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Failed to get dashboard list: ${res.status} - ${errorText}`)
  }

  return res.json() as Promise<
    Array<{
      id: string
      name: string
      simulations: TSimulationWithRelations[]
      epcis: Omit<TEpci, 'region'>[]
    }>
  >
}
