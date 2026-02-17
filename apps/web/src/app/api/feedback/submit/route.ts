import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function POST(request: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const res = await authFetch('/feedback/submit', {
    body: JSON.stringify(body),
    method: 'POST',
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
