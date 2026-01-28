export const verifyEmail = async (code: string) => {
  const response = await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/verify-mail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })
  const data = await response.json()
  return data as { message: 'invalid_code' | 'success' | 'expired_code' }
}
