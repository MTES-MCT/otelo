import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function GET() {
  const session = await getSession()

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch('/statistics/simulations')

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch simulations statistics' }, { status: res.status })
  }

  return new NextResponse(res.body, {
    headers: Object.fromEntries(res.headers.entries()),
  })
}
