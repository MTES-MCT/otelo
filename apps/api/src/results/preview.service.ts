import { Injectable } from '@nestjs/common'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { PrismaService } from '~/db/prisma.service'
import { B11Etablissement, B15Surocc } from '~/generated/prisma/client'
import { TResults } from '~/schemas/results/results'
import { ESourceB11, TScenario } from '~/schemas/scenarios/scenario'
import { TPreviewSimulationDto, TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'
import { SimulationsService } from '~/simulations/simulations.service'

const SCENARIO_DEFAULTS = {
  b1_horizon_resorption: 2050,
  b11_etablissement: [
    B11Etablissement.autreCentre,
    B11Etablissement.demandeAsile,
    B11Etablissement.reinsertion,
    B11Etablissement.centreProvisoire,
  ],
  b11_fortune: true,
  b11_hotel: true,
  b11_part_etablissement: 50,
  b11_sa: true,
  b12_cohab_interg_subie: 30,
  b12_heberg_particulier: true,
  b12_heberg_temporaire: true,
  b13_acc: false,
  b13_plp: true,
  b13_taux_effort: 30,
  b13_taux_reallocation: 90,
  b14_confort: 'RP_abs_sani',
  b14_occupation: 'prop_loc',
  b14_qualite: undefined,
  b14_taux_reallocation: 50,
  b15_loc_hors_hlm: true,
  b15_proprietaire: false,
  b15_surocc: B15Surocc.Acc,
  b15_taux_reallocation: 90,
  b17_motif: 'Tout' as const,
  b2_scenario: 'Central_C',
  millesime: '2021',
  projection: 2030,
  source_b11: ESourceB11.RP,
  source_b14: 'Filo' as const,
  source_b15: 'Filo' as const,
} satisfies Partial<TScenario>

const DEFAULT_EPCI_RATES = {
  b2_tx_disparition: 0,
  b2_tx_restructuration: 0,
  b2_tx_rs: 0,
  b2_tx_vacance: 0,
  b2_tx_vacance_courte: 0,
  b2_tx_vacance_longue: 0,
}

@Injectable()
export class PreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly simulationsService: SimulationsService,
    private readonly needsCalculationService: NeedsCalculationService,
  ) {}

  async calculate(dto: TPreviewSimulationDto, userId: string): Promise<TResults> {
    let baseScenario: TScenario
    let epciCodes: string[]

    if (dto.simulationId) {
      const owns = await this.simulationsService.hasUserAccessTo(dto.simulationId, userId)
      if (!owns) {
        throw new Error('Accès refusé à cette simulation')
      }
      const persisted = await this.simulationsService.get(dto.simulationId)
      baseScenario = persisted.scenario
      epciCodes = dto.epcis && dto.epcis.length > 0 ? dto.epcis : persisted.epcis.map((e) => e.code)
    } else {
      baseScenario = {
        ...SCENARIO_DEFAULTS,
        id: 'preview',
        isConfidential: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        epciScenarios: [],
      }
      epciCodes = dto.epcis ?? []
    }

    if (epciCodes.length === 0) {
      throw new Error('Aucun EPCI fourni pour le calcul')
    }

    const epcis = await this.prisma.epci.findMany({
      where: { code: { in: epciCodes } },
      select: { code: true, name: true, bassinName: true },
    })

    if (epcis.length === 0) {
      throw new Error('Aucun EPCI valide trouvé pour les codes fournis')
    }

    const mergedScenario: TScenario = {
      ...baseScenario,
      ...(dto.scenario ?? {}),
      epciScenarios: epcis.map((epci) => {
        const baseEpciScenario = baseScenario.epciScenarios.find((s) => s.epciCode === epci.code)
        const override = dto.epciScenarios?.[epci.code]
        return {
          ...DEFAULT_EPCI_RATES,
          baseEpci: false,
          ...(baseEpciScenario ?? {}),
          ...(override ?? {}),
          epciCode: epci.code,
        }
      }),
    }

    const simulation: TSimulationWithEpciAndScenario = {
      id: dto.simulationId ?? 'preview',
      name: 'preview',
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      epcis,
      scenario: mergedScenario,
    }

    return this.needsCalculationService.calculate(simulation)
  }
}
