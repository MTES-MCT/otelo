import { NextRequest, NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const epcis = url.searchParams.get('epcis')
  const millesime = url.searchParams.get('millesime')

  const millesimeParam = millesime ? `&millesime=${millesime}` : ''
  const res = await authFetch(`/accommodation-rates?epcis=${epcis}${millesimeParam}`)
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch accommodation rates by epci' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
