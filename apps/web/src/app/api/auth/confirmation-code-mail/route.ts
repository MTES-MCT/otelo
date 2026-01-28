import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/confirmation-code-mail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to resend confirmation code email' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
