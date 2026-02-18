import { Injectable } from '@nestjs/common'
import { TEpci } from '@shared'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class NoAccommodationService {
  constructor(private readonly prismaService: PrismaService) {}

  async getNoAccommodationByEpci(epciCode: string, millesime?: string) {
    const [homeless, hotel, makeShiftHousingRp, finess] = await Promise.all([
      this.prismaService.homeless.findFirst({
        where: { epciCode, ...(millesime && { millesime }) },
      }),
      this.prismaService.hotel.findFirst({
        where: { epciCode, ...(millesime && { millesime }) },
      }),
      this.prismaService.makeShiftHousing_RP.findFirst({
        where: { epciCode, ...(millesime && { millesime }) },
      }),
      this.prismaService.hostedFiness.findFirst({
        where: {
          epciCode,
          ...(millesime && { millesime }),
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
  async getNoAccommodation(epcis: TEpci[], millesime?: string) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getNoAccommodationByEpci(epci.code, millesime)),
        epci,
      })),
    )

    return { noAccommodation: results }
  }
}
