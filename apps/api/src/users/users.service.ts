import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { Prisma } from '~/generated/prisma/client'
import { TUpdateUserType } from '~/schemas/users/update-user'
import { TUser } from '~/schemas/users/user'

const fieldsWithoutPassword = {
  id: true,
  email: true,
  name: true,
  image: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  firstname: true,
  lastname: true,
  role: true,
  lastLoginAt: true,
  hasAccess: true,
  engaged: true,
  type: true,
} satisfies Prisma.UserSelect

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async hasUserAccessTo(email: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { email },
    })
    return !!user && (user.role === 'ADMIN' || user.hasAccess)
  }

  async isEmailInWhitelist(email: string): Promise<boolean> {
    const whitelistEntry = await this.prisma.userWhitelist.findUnique({
      where: { email },
    })
    return !!whitelistEntry
  }

  async list(page = 1, limit = 25): Promise<{ users: TUser[]; userCount: number; page: number; limit: number; totalPages: number }> {
    const [users, userCount] = await Promise.all([
      this.prisma.user.findMany({
        select: fieldsWithoutPassword,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count(),
    ])

    return {
      users,
      userCount,
      page,
      limit,
      totalPages: Math.ceil(userCount / limit),
    }
  }

  async updateAccess(id: string, hasAccess: boolean): Promise<TUser> {
    if (!hasAccess) {
      await this.prisma.session.deleteMany({ where: { userId: id } })
    }
    return this.prisma.user.update({
      data: { hasAccess },
      where: { id },
      select: fieldsWithoutPassword,
    })
  }

  async findByEmail(email: string): Promise<TUser | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: fieldsWithoutPassword,
    })
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<TUser> {
    return this.prisma.user.update({
      data,
      select: fieldsWithoutPassword,
      where: { id },
    })
  }

  async create(user: Prisma.UserCreateInput): Promise<TUser> {
    return this.prisma.user.create({
      data: user,
      select: fieldsWithoutPassword,
    })
  }

  async getByToken(sessionToken: string): Promise<TUser> {
    return this.prisma.user.findFirstOrThrow({
      select: fieldsWithoutPassword,
      where: {
        sessions: { some: { token: sessionToken } },
      },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } })
  }

  async search(query: string): Promise<{ users: TUser[]; userCount: number; page: number; limit: number; totalPages: number }> {
    const where: Prisma.UserWhereInput = {
      OR: [
        { firstname: { contains: query, mode: 'insensitive' } },
        { lastname: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    }

    const [users, userCount] = await Promise.all([
      this.prisma.user.findMany({ select: fieldsWithoutPassword, where }),
      this.prisma.user.count({ where }),
    ])

    return { users, userCount, page: 1, limit: userCount, totalPages: 1 }
  }

  async exportCsv(): Promise<TUser[]> {
    return this.prisma.user.findMany({
      select: fieldsWithoutPassword,
    })
  }

  async updateType(id: string, { type }: TUpdateUserType): Promise<TUser> {
    return this.prisma.user.update({
      data: { type },
      where: { id },
      select: fieldsWithoutPassword,
    })
  }
}
