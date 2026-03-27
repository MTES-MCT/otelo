import { NextRequest, NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const backendFormData = new FormData()
    backendFormData.append('file', file)

    const response = await authFetch('/users/import/csv', {
      method: 'POST',
      body: backendFormData,
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error importing users CSV:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
