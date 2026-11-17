import { NextResponse } from 'next/server'
import { requireAdmin } from '~/lib/api/admin-proxy'
import { authFetch } from '~/lib/auth/server'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function DELETE(_: Request, { params }: IdRouteParams) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params

  const res = await authFetch(`/users/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: res.status })
  }

  return NextResponse.json({ success: true })
}
