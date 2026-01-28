import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TEpci } from '@shared'

@Injectable()
export class NoAccommodationService {
  constructor(private readonly prismaService: PrismaService) {}

  async getNoAccommodationByEpci(epciCode: string) {
    const [homeless, hotel, makeShiftHousingRp, finess] = await Promise.all([
      this.prismaService.homeless.findFirst({
        where: { epciCode },
      }),
      this.prismaService.hotel.findFirst({
        where: { epciCode },
      }),
      this.prismaService.makeShiftHousing_RP.findFirst({
        where: { epciCode },
      }),
      this.prismaService.hostedFiness.findFirst({
        where: {
          epciCode,
        },
      }),
    ])
    const homelessRes = homeless?.rp ?? 0
    const hotelRes = hotel?.rp ?? 0
    const finessRes = Object.entries(finess ?? {})
      .filter(([key]) => key !== 'epciCode')
      .reduce((sum, [_, value]) => sum + (value as number), 0)
    return {
      homeless: Math.round(homelessRes),
      hotel: Math.round(hotelRes),
      makeShiftHousing: Math.round(makeShiftHousingRp?.value ?? 0),
      finess: Math.round(finessRes),
    }
  }
  async getNoAccommodation(epcis: TEpci[]) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getNoAccommodationByEpci(epci.code)),
        epci,
      })),
    )

    return { noAccommodation: results }
  }
}
