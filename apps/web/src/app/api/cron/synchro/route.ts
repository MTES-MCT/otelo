import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch('/cron/synchro')
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to synchro ds' }, { status: res.status })
  }
  return NextResponse.json({ message: 'Synchro ds' })
}
