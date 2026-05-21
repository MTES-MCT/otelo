import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { DataPackVersion } from '~/generated/prisma/client'

@Injectable()
export class DataPackVersionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<DataPackVersion[]> {
    return this.prisma.dataPackVersion.findMany({
      orderBy: { millesime: 'desc' },
    })
  }

  async getActive(): Promise<DataPackVersion> {
    return this.prisma.dataPackVersion.findFirstOrThrow({
      where: { isActive: true },
    })
  }
}
