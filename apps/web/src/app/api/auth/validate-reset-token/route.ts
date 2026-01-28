import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/validate-reset-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Invalid reset token' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
