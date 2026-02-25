import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/admin/consumers/${id}/key`)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to get key' }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}
