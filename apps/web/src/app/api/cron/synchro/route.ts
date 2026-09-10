import { NextResponse } from 'next/server'
import { requireAdmin } from '~/lib/api/admin-proxy'
import { authFetch } from '~/lib/auth/server'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  const res = await authFetch('/cron/synchro')
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to synchro ds' }, { status: res.status })
  }
  return NextResponse.json({ message: 'Synchro ds' })
}
