import { NextResponse } from 'next/server'
import { requireAdmin } from '~/lib/api/admin-proxy'
import { authFetch } from '~/lib/auth/server'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  const res = await authFetch('/admin/consumers')
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch consumers' }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

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
