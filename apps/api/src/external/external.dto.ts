import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ZExternalUpdateScenario } from '~/schemas/scenarios/scenario'

const B2_SCENARIOS = ['Central_B', 'Central_C', 'Central_H', 'PB_B', 'PB_C', 'PB_H', 'PH_B', 'PH_C', 'PH_H'] as const

const ZCreateScenario = ZExternalUpdateScenario.omit({ epciScenarios: true }).extend({
  b2_scenario: z
    .enum(B2_SCENARIOS)
    .describe('Scénario démographique : Population (Central, PH=haute, PB=basse) + Ménages (B=décélération, C=tendanciel, H=accélération)'),
  projection: z.number().int().min(2021).max(2050).describe('Année de projection (entre 2021 et 2050)'),
  epcis: z
    .record(
      z.string(),
      z.object({
        b2_tx_disparition: z.number().optional().describe('Taux de disparition'),
        b2_tx_restructuration: z.number().optional().describe('Taux de restructuration'),
        b2_tx_rs: z.number().optional().describe('Taux résidences secondaires'),
        b2_tx_vacance: z.number().optional().describe('Taux vacance'),
        b2_tx_vacance_longue: z.number().optional().describe('Taux vacance longue durée'),
        b2_tx_vacance_courte: z.number().optional().describe('Taux vacance courte durée'),
        baseEpci: z.boolean().describe('EPCI de base pour le calcul'),
      }),
    )
    .describe('Paramétrage par EPCI (clé = code EPCI)'),
})

const ZCreateSimulationBody = z.object({
  name: z.string().describe('Nom de la simulation'),
  epci: z.array(z.object({ code: z.string().describe('Code EPCI (SIREN)') })).describe('Liste des EPCI'),
  scenario: ZCreateScenario,
  epciGroupName: z.string().optional().describe("Nom du groupe d'EPCI (optionnel)"),
})

export class CreateSimulationDto extends createZodDto(ZCreateSimulationBody) {}

export class UpdateScenarioDto extends createZodDto(ZExternalUpdateScenario) {}

const ZEpciCalculationResult = z.object({
  epciCode: z.string(),
  value: z.number().describe('Valeur brute'),
  prorataValue: z.number().describe('Valeur prorata'),
})

const ZCalculationResult = z.object({
  epcis: z.array(ZEpciCalculationResult),
  total: z.number(),
  prorataTotal: z.number(),
})

const ZEpciTotal = z.object({
  epciCode: z.string(),
  total: z.number().describe('Total (stock + flux)'),
  totalFlux: z.number().describe('Total besoins flux (B2)'),
  totalStock: z.number().describe('Total besoins stock (B1)'),
  vacantAccomodation: z.number().describe('Logements vacants'),
  secondaryAccommodation: z.number().describe('Résidences secondaires'),
})

const ZResultsResponse = z.object({
  epcisTotals: z.array(ZEpciTotal).describe('Totaux par EPCI'),
  total: z.number().describe('Total général (stock + flux)'),
  totalFlux: z.number().describe('Total besoins flux (B2)'),
  totalStock: z.number().describe('Total besoins stock (B1)'),
  vacantAccomodation: z.number().describe('Logements vacants'),
  secondaryAccommodation: z.number().describe('Residences secondaires'),
  noAccomodation: ZCalculationResult.describe('Détail sans-domicile (B11)'),
  hosted: ZCalculationResult.describe('Détail héberges (B12)'),
  financialInadequation: ZCalculationResult.describe('Détail inadéquation financière (B13)'),
  badQuality: ZCalculationResult.describe('Détail mauvaise qualité (B14)'),
  physicalInadequation: ZCalculationResult.describe('Détail suroccupation (B15)'),
})

const ZSimulationWithResults = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  epcis: z.array(z.object({ code: z.string(), name: z.string(), bassinName: z.string().optional() })),
  results: ZResultsResponse,
})

export class SimulationWithResultsDto extends createZodDto(ZSimulationWithResults) {}

const ZSimulationListItem = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  epcis: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      region: z.string().optional(),
      bassinName: z.string().optional(),
    }),
  ),
  scenario: z.object({
    b2_scenario: z.enum(B2_SCENARIOS),
    projection: z.number().int().min(2021).max(2050),
  }),
  epciGroup: z.object({ id: z.string(), name: z.string() }).optional(),
})

export class SimulationListItemDto extends createZodDto(ZSimulationListItem) {}

const ZErrorResponse = z.object({
  statusCode: z.number(),
  message: z.string(),
})

export class UnauthorizedResponseDto extends createZodDto(ZErrorResponse) {}
export class NotFoundResponseDto extends createZodDto(ZErrorResponse) {}
