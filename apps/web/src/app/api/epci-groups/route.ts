import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch('/epci-groups')

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch EPCI groups' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
