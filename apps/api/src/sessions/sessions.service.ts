import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '~/db/prisma.service'
import { Role } from '~/generated/prisma/enums'
import { TSession } from '~/schemas/sessions/session'
import { TUser } from '~/schemas/users/user'
import { UsersService } from '~/users/users.service'

interface JwtPayload {
  exp: number
  iat: number
  sub: string
}

@Injectable()
export class SessionsService {
  private readonly ACCESS_TOKEN_EXPIRY = 60 * 60
  private readonly REFRESH_TOKEN_EXPIRY = 15 * 24 * 60 * 60
  private readonly JWT_SECRET: string
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.JWT_SECRET = this.configService.getOrThrow('JWT_SECRET')
  }

  private generateAccessToken(user: TUser): {
    expiresAt: Date
    token: string
  } {
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + this.ACCESS_TOKEN_EXPIRY)

    const token = this.jwtService.sign(
      {
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        sub: user.id,
      },
      { expiresIn: this.ACCESS_TOKEN_EXPIRY },
    )

    return { expiresAt, token }
  }

  private generateRefreshToken(user: TUser): {
    expiresAt: Date
    token: string
  } {
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + this.REFRESH_TOKEN_EXPIRY)

    const token = this.jwtService.sign(
      {
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        sub: user.id,
      },
      { expiresIn: this.REFRESH_TOKEN_EXPIRY },
    )

    return { expiresAt, token }
  }

  async isValidToken(accessToken: string): Promise<TSession | null> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(accessToken, {
        secret: this.JWT_SECRET,
      })

      return await this.prisma.session.findFirst({
        where: {
          accessToken,
          expiresAt: {
            gt: new Date(),
          },
          userId: payload.sub,
        },
      })
    } catch {
      return null
    }
  }

  async isValidRefreshToken(refreshToken: string): Promise<TSession | null> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.JWT_SECRET,
      })

      return await this.prisma.session.findFirst({
        where: {
          refreshToken,
          userId: payload.sub,
        },
      })
    } catch {
      return null
    }
  }

  async upsert(sessionUserDto: TUser): Promise<TSession> {
    const { id: userId } = sessionUserDto

    const session = await this.prisma.session.findFirst({
      where: { userId },
    })

    if (session) {
      const { expiresAt: accessTokenExpiresAt, token: newAccessToken } = this.generateAccessToken(sessionUserDto)
      const { token: newRefreshToken } = this.generateRefreshToken(sessionUserDto)

      return this.prisma.session.update({
        data: {
          accessToken: newAccessToken,
          expiresAt: accessTokenExpiresAt,
          refreshToken: newRefreshToken,
        },
        where: { id: session.id },
      })
    }

    const { expiresAt: accessTokenExpiresAt, token: accessToken } = this.generateAccessToken(sessionUserDto)
    const { token: newRefreshToken } = this.generateRefreshToken(sessionUserDto)

    return this.prisma.session.create({
      data: {
        accessToken,
        expiresAt: accessTokenExpiresAt,
        refreshToken: newRefreshToken,
        userId,
      },
    })
  }

  async deleteByToken(accessToken: string): Promise<void> {
    const session = await this.prisma.session.findFirst({
      where: {
        accessToken,
      },
    })

    if (session) {
      await this.prisma.session.delete({
        where: { id: session.id },
      })
    }
  }

  async refreshTokens(oldRefreshToken: string): Promise<{ session: TSession; user: TUser }> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(oldRefreshToken, {
        secret: this.JWT_SECRET,
      })

      const session = await this.prisma.session.findFirst({
        include: {
          user: true,
        },
        where: {
          refreshToken: oldRefreshToken,
          userId: payload.sub,
        },
      })
      if (!session) {
        throw new UnauthorizedException('Invalid refresh token')
      }
      const { expiresAt: accessTokenExpiresAt, token: newAccessToken } = this.generateAccessToken(session.user)
      const { token: newRefreshToken } = this.generateRefreshToken(session.user)

      const updatedSession = await this.prisma.session.create({
        data: {
          accessToken: newAccessToken,
          expiresAt: accessTokenExpiresAt,
          refreshToken: newRefreshToken,
          userId: payload.sub,
        },
      })

      const user = await this.usersService.getByToken(updatedSession.accessToken)
      return { session: updatedSession, user }
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token', { cause: error })
    }
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    })
  }

  async validateActiveImpersonation(adminUserId: string, targetUserId: string): Promise<boolean> {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { id: true, role: true },
    })

    if (!admin || admin.role !== Role.ADMIN) {
      return false
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    })

    if (!targetUser || targetUser.role === Role.ADMIN) {
      return false
    }

    const activeImpersonation = await this.prisma.impersonationSession.findFirst({
      where: {
        adminUserId,
        targetUserId,
        isActive: true,
      },
    })

    return !!activeImpersonation
  }

  async cleanInvalidImpersonationSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { impersonatedUserId: null },
    })
  }
}
