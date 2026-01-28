import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return NextResponse.json({ success: true })
}
