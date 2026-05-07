import { NextRequest, NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = new URLSearchParams()
  const territoire = request.nextUrl.searchParams.get('territoire')
  const typology = request.nextUrl.searchParams.get('typology')

  if (territoire) params.set('territoire', territoire)
  if (typology) params.set('typology', typology)

  // Non-admin users only see their own scenarios
  if (session.user.role !== 'ADMIN') {
    params.set('userId', session.user.id)
  }

  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await authFetch(`/statistics/pilotage/scenarios-list${query}`)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch scenarios list' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
