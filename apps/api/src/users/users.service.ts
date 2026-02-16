import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { Prisma } from '~/generated/prisma/client'
import { TUpdateUserType } from '~/schemas/users/update-user'
import { TUser, TUserList } from '~/schemas/users/user'

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

  async list(): Promise<{ userCount: number; users: TUser[] }> {
    const users = await this.prisma.user.findMany()
    const userCount = await this.prisma.user.count()

    return {
      userCount,
      users,
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

  async search(query: string): Promise<{ userCount: number; users: TUserList[] }> {
    const foundUsers = await this.prisma.user.findMany({
      select: {
        createdAt: true,
        email: true,
        firstname: true,
        id: true,
        lastLoginAt: true,
        lastname: true,
        hasAccess: true,
        engaged: true,
        role: true,
      },
      where: {
        OR: [{ firstname: { contains: query } }, { lastname: { contains: query } }, { email: { contains: query } }],
      },
    })
    const users = foundUsers.map(({ createdAt, hasAccess, engaged, email, firstname, id, lastLoginAt, lastname, role }) => ({
      createdAt,
      email,
      firstname,
      id,
      lastLoginAt,
      lastname,
      role,
      hasAccess,
      engaged,
    }))
    return {
      userCount: users.length,
      users,
    }
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

  async updateType(id: string, { type }: TUpdateUserType): Promise<TUser> {
    return this.prisma.user.update({
      data: { type },
      where: { id },
      select: fieldsWithoutPassword,
    })
  }
}
