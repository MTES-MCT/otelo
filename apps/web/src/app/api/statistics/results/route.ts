import { NextResponse } from 'next/server'
import { requireAdmin } from '~/lib/api/admin-proxy'
import { authFetch } from '~/lib/auth/server'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  const res = await authFetch('/statistics/results')

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch results statistics' }, { status: res.status })
  }

  return new NextResponse(res.body, {
    headers: Object.fromEntries(res.headers.entries()),
  })
}
