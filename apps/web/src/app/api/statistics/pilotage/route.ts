import { NextRequest, NextResponse } from 'next/server'
import { requirePilotageAccess } from '~/lib/api/admin-proxy'
import { authFetch } from '~/lib/auth/server'

export async function GET(request: NextRequest) {
  const denied = await requirePilotageAccess()
  if (denied) return denied

  const params = new URLSearchParams()
  const region = request.nextUrl.searchParams.get('region')
  const department = request.nextUrl.searchParams.get('department')
  if (region) params.set('region', region)
  if (department) params.set('department', department)
  const query = params.toString() ? `?${params.toString()}` : ''

  const res = await authFetch(`/statistics/pilotage${query}`)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch pilotage statistics' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
