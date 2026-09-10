import { NextResponse } from 'next/server'
import { requireAdmin } from '~/lib/api/admin-proxy'
import { authFetch } from '~/lib/auth/server'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  const res = await authFetch('/statistics')

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
