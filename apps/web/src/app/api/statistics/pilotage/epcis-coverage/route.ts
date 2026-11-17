import { NextRequest, NextResponse } from 'next/server'
import { requirePilotageAccess } from '~/lib/api/admin-proxy'
import { authFetch } from '~/lib/auth/server'

export async function GET(request: NextRequest) {
  const denied = await requirePilotageAccess()
  if (denied) return denied

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
