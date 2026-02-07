import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'

// Session type for Better Auth
interface BetterAuthSession {
  id: string
  token: string
  expiresAt: Date
  userId: string
  impersonatedBy: string | null
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a session by its token
   * Better Auth uses session tokens stored in cookies
   */
  async findByToken(token: string): Promise<BetterAuthSession | null> {
    return this.prisma.session.findUnique({
      where: { token },
    })
  }

  /**
   * Validate a session token and return the session if valid
   */
  async isValidToken(token: string): Promise<BetterAuthSession | null> {
    const session = await this.prisma.session.findUnique({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
    })
    return session
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    })
  }
}
