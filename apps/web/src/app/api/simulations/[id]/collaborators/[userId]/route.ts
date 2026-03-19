import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

type RouteParams = {
  params: Promise<{ id: string; userId: string }>
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const { id, userId } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/simulations/${id}/collaborators/${userId}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: res.status })
  }

  return NextResponse.json({ success: true })
}
