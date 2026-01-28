import NextAuth from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
