import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function GET(_: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/export-excel/${id}`)
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to get simulation export' }, { status: res.status })
  }

  return new NextResponse(res.body, {
    headers: Object.fromEntries(res.headers.entries()),
  })
}
