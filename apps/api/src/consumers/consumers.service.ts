import { Injectable, NotFoundException } from '@nestjs/common'
import { createHash, randomBytes } from 'crypto'
import { decrypt, encrypt } from '~/common/utils/encryption'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class ConsumersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string }) {
    const rawKey = `otelo_${randomBytes(32).toString('hex')}`
    const hashedKey = createHash('sha256').update(rawKey).digest('hex')
    const encryptedKey = encrypt(rawKey)
    const prefix = rawKey.slice(6, 14)

    const consumer = await this.prisma.apiConsumer.create({
      data: {
        name: data.name,
        hashedKey,
        encryptedKey,
        prefix,
      },
    })

    return {
      id: consumer.id,
      name: consumer.name,
      prefix: consumer.prefix,
      active: consumer.active,
      createdAt: consumer.createdAt,
      key: rawKey,
    }
  }

  async list() {
    return this.prisma.apiConsumer.findMany({
      select: {
        id: true,
        name: true,
        prefix: true,
        active: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async get(id: string) {
    const consumer = await this.prisma.apiConsumer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        prefix: true,
        active: true,
        createdAt: true,
        lastUsedAt: true,
      },
    })

    if (!consumer) {
      throw new NotFoundException('Consumer not found')
    }

    return consumer
  }

  async getKey(id: string) {
    const consumer = await this.prisma.apiConsumer.findUnique({
      where: { id },
      select: { encryptedKey: true },
    })

    if (!consumer) {
      throw new NotFoundException('Consumer not found')
    }

    return { key: decrypt(consumer.encryptedKey) }
  }

  async update(id: string, data: { name?: string; active?: boolean }) {
    await this.get(id)
    return this.prisma.apiConsumer.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        prefix: true,
        active: true,
        createdAt: true,
        lastUsedAt: true,
      },
    })
  }

  async delete(id: string) {
    await this.get(id)
    return this.prisma.apiConsumer.delete({ where: { id } })
  }

  async regenerateKey(id: string) {
    await this.get(id)

    const rawKey = `otelo_${randomBytes(32).toString('hex')}`
    const hashedKey = createHash('sha256').update(rawKey).digest('hex')
    const encryptedKey = encrypt(rawKey)
    const prefix = rawKey.slice(6, 14)

    const consumer = await this.prisma.apiConsumer.update({
      where: { id },
      data: { hashedKey, encryptedKey, prefix },
      select: {
        id: true,
        name: true,
        prefix: true,
        active: true,
        createdAt: true,
      },
    })

    return { ...consumer, key: rawKey }
  }
}
