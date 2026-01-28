import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { DemographicEvolutionService } from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { RenewalHousingStockService } from '~/calculation/needs-calculation/besoins-flux/occupation-renouvellement-parc-logements-b22/renewal-housing-stock.service'
import { SocialParcService } from '~/calculation/needs-calculation/besoins-stock/besoins-menages-social-b17/social-parc.service'
import { HostedService } from '~/calculation/needs-calculation/besoins-stock/heberges-b12/hosted.service'
import { NoAccomodationService } from '~/calculation/needs-calculation/besoins-stock/hors-logement-b11/no-accomodation.service'
import { FinancialInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-financiere-b13/financial-inadequation.service'
import { PhysicalInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-physique-b15/physical-inadequation.service'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { PrismaService } from '~/db/prisma.service'
import { NeedsCalculationService } from './needs-calculation.service'

describe('NeedsCalculationService', () => {
  let service: NeedsCalculationService
  const mockContext: CalculationContext = {
    simulation: {
      coefficient: 1.0,
      scenario: {
        b2_scenario_omphale: 'CENTRAL',
      },
    },
  } as unknown as CalculationContext
  const mockPrismaService = createMock<PrismaService>()
  const horsLogementService = createMock<NoAccomodationService>()
  const hebergesService = createMock<HostedService>()
  const inadFinanciereService = createMock<FinancialInadequationService>()
  const mauvaiseQualiteService = createMock<BadQualityService>()
  const inadPhysiqueService = createMock<PhysicalInadequationService>()
  const besoinsMenagesSocialService = createMock<SocialParcService>()
  const evolutionDemographiqueService = createMock<DemographicEvolutionService>()
  const occupationRenouvellementParcLogementsService = createMock<RenewalHousingStockService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NeedsCalculationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NoAccomodationService,
          useValue: horsLogementService,
        },
        {
          provide: HostedService,
          useValue: hebergesService,
        },
        {
          provide: FinancialInadequationService,
          useValue: inadFinanciereService,
        },
        {
          provide: BadQualityService,
          useValue: mauvaiseQualiteService,
        },
        {
          provide: PhysicalInadequationService,
          useValue: inadPhysiqueService,
        },
        {
          provide: SocialParcService,
          useValue: besoinsMenagesSocialService,
        },
        {
          provide: DemographicEvolutionService,
          useValue: evolutionDemographiqueService,
        },
        {
          provide: RenewalHousingStockService,
          useValue: occupationRenouvellementParcLogementsService,
        },
        {
          provide: 'CalculationContext',
          useValue: mockContext,
        },
      ],
    }).compile()

    service = module.get<NeedsCalculationService>(NeedsCalculationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
