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
  if (region) params.set('region', region)
  if (department) params.set('department', department)
  const query = params.toString() ? `?${params.toString()}` : ''

  const res = await authFetch(`/statistics/pilotage/export${query}`)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to export pilotage statistics' }, { status: res.status })
  }

  return new NextResponse(res.body, {
    headers: Object.fromEntries(res.headers.entries()),
  })
}
