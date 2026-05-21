import { Injectable } from '@nestjs/common'
import { TEpcisAccommodationRates } from '@shared'
import { PrismaService } from '~/db/prisma.service'
import { VacancyService } from '~/vacancy/vacancy.service'

@Injectable()
export class AccommodationRatesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly vacancyService: VacancyService,
  ) {}

  private getUrbanRenewalAnnualizationDivisor(millesime?: string): number {
    const year = Number(millesime)
    return Number.isFinite(year) && year >= 2022 ? 1 : 6
  }

  async getAccommodationRates(epcis: string, millesime?: string): Promise<TEpcisAccommodationRates> {
    const epcisCodes = epcis.split(',')

    const [filocomData, vacancyData] = await Promise.all([
      this.prismaService.filocomFlux.findMany({
        where: {
          epciCode: { in: epcisCodes },
          ...(millesime && { millesime }),
        },
      }),
      this.vacancyService.getNewestVacancy(epcisCodes, millesime),
    ])

    return epcisCodes.reduce<TEpcisAccommodationRates>((acc, epciCode) => {
      const epciVacancy = vacancyData.find((v) => v.epciCode === epciCode)
      const epciFilocom = filocomData.find((f) => f.epciCode === epciCode)
      const divisor = this.getUrbanRenewalAnnualizationDivisor(millesime ?? epciFilocom?.millesime)
      const totalVacantCount = epciVacancy?.nbLogVac2Less ?? 0
      const longTermVacantCount = epciVacancy?.nbLogVac2More ?? 0
      const ratioLongGlobalTerm = totalVacantCount > 0 ? longTermVacantCount / totalVacantCount : 0
      const ratioShortGlobalTerm = totalVacantCount > 0 ? (totalVacantCount - longTermVacantCount) / totalVacantCount : 0
      const longTermVacancyRate = (epciFilocom?.txLvParctot ?? 0) * ratioLongGlobalTerm
      const shortTermVacancyRate = (epciFilocom?.txLvParctot ?? 0) * ratioShortGlobalTerm

      acc[epciCode] = {
        vacancyRate: longTermVacancyRate + shortTermVacancyRate,
        longTermVacancyRate,
        shortTermVacancyRate,
        txRs: epciFilocom?.txRsParctot ?? 0,
        urbanRenewal: epciFilocom?.parctot ?? 0,
        vacancy: {
          nbAccommodation: (epciVacancy?.nbLogVac2More ?? 0) + (epciVacancy?.nbLogVac5More ?? 0),
          year: epciVacancy?.year,
        },
        restructuringRate: (epciFilocom?.txRestParctot ?? 0) / divisor,
        disappearanceRate: (epciFilocom?.txDispParctot ?? 0) / divisor,
        totalVacantCount,
        longTermVacantCount,
      }
      return acc
    }, {})
  }
}
