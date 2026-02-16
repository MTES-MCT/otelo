import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'
import type { CodeRouteParams } from '~/types/simulation-page-props'

export async function GET(_: Request, { params }: CodeRouteParams) {
  const { code } = await params
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/epcis/${code}`)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch epci' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
