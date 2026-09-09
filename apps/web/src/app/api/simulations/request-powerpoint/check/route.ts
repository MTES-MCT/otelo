import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

/**
 * Vérifie, avant toute génération, si la demande viendrait doubler une demande
 * récente sur le même territoire.
 */
export async function POST(request: Request) {
  const body = await request.json()
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch('/export-powerpoint/check', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to check powerpoint request' }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}
