import { NextResponse } from 'next/server'
import { requireAdmin } from '~/lib/api/admin-proxy'
import { authFetch } from '~/lib/auth/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await request.json()
  const res = await authFetch(`/admin/consumers/${id}`, {
    body: JSON.stringify(body),
    method: 'PATCH',
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to update consumer' }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params
  const denied = await requireAdmin()
  if (denied) return denied

  const res = await authFetch(`/admin/consumers/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to delete consumer' }, { status: res.status })
  }

  return NextResponse.json({ success: true })
}
