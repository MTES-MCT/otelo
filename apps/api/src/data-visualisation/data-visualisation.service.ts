import { Injectable } from '@nestjs/common'
import { TEpci } from '@shared'
import { BadQualityService } from '~/bad-quality/bad-quality.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { EpcisService } from '~/epcis/epcis.service'
import { FinancialInadequationService } from '~/financial-inadequation/financial-inadequation.service'
import { HostedService } from '~/hosted/hosted.service'
import { HouseholdSizesService } from '~/household-sizes/household-sizes.service'
import { NoAccommodationService } from '~/no-accommodation/no-accommodation.service'
import { PhysicalInadequationService } from '~/physical-inadequation/physical-inadequation.service'
import { RpInseeService } from '~/rp-insee/rp-insee.service'
import { TDataVisualisationQuery, TInadequateHousing } from '~/schemas/data-visualisation/data-visualisation'
import { SitadelService } from '~/sitadel/sitadel.service'
import { VacancyService } from '~/vacancy/vacancy.service'

@Injectable()
export class DataVisualisationService {
  constructor(
    private readonly epcisService: EpcisService,
    private readonly demographicEvolutionService: DemographicEvolutionService,
    private readonly rpInseeService: RpInseeService,
    private readonly vacancyService: VacancyService,
    private readonly hostedService: HostedService,
    private readonly noAccommodationService: NoAccommodationService,
    private readonly badQualityService: BadQualityService,
    private readonly financialInadequationService: FinancialInadequationService,
    private readonly physicalInadequationService: PhysicalInadequationService,
    private readonly sitadelService: SitadelService,
    private readonly householdSizesService: HouseholdSizesService,
  ) {}

  async getInadequateHousing(epcis: TEpci[], millesime?: string): Promise<TInadequateHousing> {
    const { hosted } = await this.hostedService.getHosted(epcis, millesime)
    const { noAccommodation } = await this.noAccommodationService.getNoAccommodation(epcis, millesime)
    const { badQuality } = await this.badQualityService.getBadQuality(epcis, millesime)
    const { financialInadequation } = await this.financialInadequationService.getFinancialInadequation(epcis, millesime)
    const { physicalInadequation } = await this.physicalInadequationService.getPhysicalInadequation(epcis, millesime)

    return epcis.reduce((acc, epci) => {
      const hostedData = hosted.find((h) => h.epci.code === epci.code)
      const noAccommodationData = noAccommodation.find((n) => n.epci.code === epci.code)
      const badQualityData = badQuality.find((b) => b.epci.code === epci.code)
      const financialInadequationData = financialInadequation.find((f) => f.epci.code === epci.code)
      const physicalInadequationData = physicalInadequation.find((p) => p.epci.code === epci.code)

      acc[epci.code] = {
        name: epci.name,
        hosted: {
          filocom: hostedData?.data?.filocom || 0,
          sne: hostedData?.data?.sne || 0,
          total: hostedData?.data?.total || 0,
        },
        noAccommodation: {
          total: Math.round(
            (noAccommodationData?.homeless || 0) +
              (noAccommodationData?.hotel || 0) +
              (noAccommodationData?.makeShiftHousing || 0) +
              (noAccommodationData?.finess || 0),
          ),
          hotel: noAccommodationData?.hotel || 0,
          homeless: noAccommodationData?.homeless || 0,
          makeShiftHousing: noAccommodationData?.makeShiftHousing || 0,
          finess: noAccommodationData?.finess || 0,
        },
        badQuality: badQualityData?.data || 0,
        financialInadequation: financialInadequationData?.data || 0,
        physicalInadequation: physicalInadequationData?.data || 0,
      }
      return acc
    }, {} as TInadequateHousing)
  }

  async getDataByType(query: TDataVisualisationQuery) {
    const { epci, type, populationType, source, millesime } = query
    const bassinEpcis = await this.epcisService.getBassinEpcisByEpciCode(epci)
    const epcis = bassinEpcis.map((epci) => ({
      code: epci.code,
      name: epci.name,
      region: epci.region,
      bassinName: epci.bassinName,
    }))

    switch (type) {
      case 'projection-menages-evolution':
        return this.demographicEvolutionService.getDemographicEvolutionOmphaleAndYear(epcis, populationType, millesime)
      case 'projection-population-evolution':
        return this.demographicEvolutionService.getDemographicEvolutionPopulationAndYear(epcis, millesime)
      case 'menage-evolution':
        return this.rpInseeService.getRP(epcis, 'menage', millesime)
      case 'population-evolution':
        return this.rpInseeService.getRP(epcis, 'population', millesime)
      case 'residences-secondaires':
        if (source === 'rp') {
          return this.rpInseeService.getRP(epcis, 'secondaryAccommodation', millesime)
        }
        return []
      // todo - handle it when filocom data is available
      // return this.filocomService.getFilocomByEpci(epcis)
      case 'logements-vacants':
        if (source === 'rp') {
          return this.rpInseeService.getRP(epcis, 'vacant', millesime)
        }
        return this.vacancyService.getVacancy(epcis, millesime)
      case 'mal-logement':
        return this.getInadequateHousing(epcis, millesime)
      case 'sitadel':
        return this.sitadelService.getSitadel(epcis, millesime)
      case 'taille-menages':
        return this.householdSizesService.getHouseholdSizes(epcis, millesime)
      default:
        throw new Error('Invalid data visualisation type')
    }
  }
}
