import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class FilocomService {
  constructor(private readonly prismaService: PrismaService) {}

  async getFilocomByEpci(epciCodes: string[]) {
    const data = await this.prismaService.filocomFlux.findMany({
      where: {
        epciCode: { in: epciCodes },
      },
    })

    return data
  }
}
