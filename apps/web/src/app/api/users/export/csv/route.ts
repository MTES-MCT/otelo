import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch('/users/export/csv')
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to export users' }, { status: res.status })
  }

  return new NextResponse(res.body, {
    headers: Object.fromEntries(res.headers.entries()),
  })
}
