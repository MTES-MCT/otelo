import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '~/lib/api/admin-proxy'
import { authFetch } from '~/lib/auth/server'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function PATCH(request: NextRequest, { params }: IdRouteParams) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params

  const body = await request.json()

  const res = await authFetch(`/admin/users/${id}/region`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to update user region' }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}
