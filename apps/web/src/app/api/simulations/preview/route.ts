import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function POST(request: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const endpoint = body.simulationId ? `/simulations/${encodeURIComponent(body.simulationId)}/preview` : '/simulations/preview'

  const response = await authFetch(endpoint, {
    body: JSON.stringify(body),
    method: 'POST',
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to preview simulation' }, { status: response.status })
  }

  const data = await response.json()
  return NextResponse.json(data)
}
