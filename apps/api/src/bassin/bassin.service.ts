import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { Bassin } from '~/generated/prisma/client'

@Injectable()
export class BassinService {
  constructor(private readonly prismaService: PrismaService) {}

  async findByName(name: string): Promise<Bassin> {
    return this.prismaService.bassin.findUniqueOrThrow({ where: { name } })
  }

  async findByEpci(epciCode: string): Promise<Bassin> {
    return this.prismaService.bassin.findFirstOrThrow({ where: { epcis: { some: { code: epciCode } } } })
  }
}
