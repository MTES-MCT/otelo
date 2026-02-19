import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function GET() {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch('/admin/consumers')
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch consumers' }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const res = await authFetch('/admin/consumers', {
    body: JSON.stringify(body),
    method: 'POST',
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to create consumer' }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}
