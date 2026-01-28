import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const epciCode = formData.get('epciCode') as string
    const scenarioId = formData.get('scenarioId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!epciCode) {
      return NextResponse.json({ error: 'EPCI code is required' }, { status: 400 })
    }

    // Create a new FormData to send to the backend
    const backendFormData = new FormData()
    backendFormData.append('file', file)
    backendFormData.append('epciCode', epciCode)
    if (scenarioId) {
      backendFormData.append('scenarioId', scenarioId)
    }

    const response = await fetch(`${process.env.NEXT_OTELO_API_URL}/demographic-evolution-custom/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: backendFormData,
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error uploading demographic evolution custom file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
