import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

type Params = { params: Promise<{ id: string }> }

export async function POST(_: Request, { params }: Params) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/admin/consumers/${id}/regenerate-key`, {
    method: 'POST',
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to regenerate key' }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}
