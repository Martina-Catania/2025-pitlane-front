import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getBackendBaseUrl() {
  const backendBaseUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL

  if (!backendBaseUrl) {
    throw new Error(
      'Missing backend URL. Set BACKEND_URL, NEXT_PUBLIC_BACKEND_URL, or NEXT_PUBLIC_API_URL.'
    )
  }

  const normalized = backendBaseUrl.endsWith('/')
    ? backendBaseUrl.slice(0, -1)
    : backendBaseUrl

  try {
    return new URL(normalized).toString().replace(/\/$/, '')
  } catch {
    throw new Error(`Invalid backend URL configuration: ${backendBaseUrl}`)
  }
}

export async function PUT(request: Request) {
  try {
    const { calorieGoal } = await request.json()
    const backendBaseUrl = getBackendBaseUrl()
    const supabase = await createClient()
    
    // Get the user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Make request to backend
    const backendResponse = await fetch(`${backendBaseUrl}/profile/${userId}/calorie-goal`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ calorieGoal })
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text()
      console.error('Backend error:', errorData)
      return NextResponse.json(
        { error: 'Server error' },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error updating calorie goal:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' ? { details: errorMessage } : {}),
      },
      { status: 500 }
    )
  }
}