import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function POST(request: Request) {
  const body = await request.json()
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch('/export-powerpoint', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to request powerpoint' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
