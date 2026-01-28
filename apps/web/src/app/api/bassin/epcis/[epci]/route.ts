import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'
import type { EpciRouteParams } from '~/types/simulation-page-props'

export async function GET(_: NextRequest, { params }: EpciRouteParams) {
  const { epci } = await params
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/epcis/${epci}/bassin`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch bassin epcis list' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
