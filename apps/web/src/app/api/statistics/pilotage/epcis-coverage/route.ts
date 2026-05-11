import { NextRequest, NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = new URLSearchParams()
  const region = request.nextUrl.searchParams.get('region')
  const department = request.nextUrl.searchParams.get('department')
  const typology = request.nextUrl.searchParams.get('typology')
  if (region) params.set('region', region)
  if (department) params.set('department', department)
  if (typology) params.set('typology', typology)
  const query = params.toString() ? `?${params.toString()}` : ''

  const res = await authFetch(`/statistics/pilotage/epcis-coverage${query}`)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch EPCI coverage data' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
