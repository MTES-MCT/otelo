import { NextResponse } from 'next/server'
import { proxyAdminJson } from '~/lib/api/admin-proxy'
import { unauthFetch } from '~/lib/auth/server'

export async function GET(request: Request) {
  return proxyAdminJson('/users', request, ['page', 'limit', 'sortBy', 'sortOrder'])
}

export async function POST(request: Request) {
  const body = await request.json()
  const res = await unauthFetch('/auth/sign-up/email', {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
