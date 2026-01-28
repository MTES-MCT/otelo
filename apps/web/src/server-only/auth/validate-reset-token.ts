export const validateResetToken = async (token: string | undefined) => {
  if (!token) {
    return { state: 'missing_token' as const }
  }

  try {
    const response = await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/check-reset-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      return { state: 'invalid_token' as const }
    }

    return { state: 'valid' as const }
  } catch {
    return { state: 'invalid_token' as const }
  }
}
