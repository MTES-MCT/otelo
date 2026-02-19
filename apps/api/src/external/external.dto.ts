import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ZExternalUpdateScenario } from '~/schemas/scenarios/scenario'

const ZCreateSimulationBody = z.object({
  name: z.string().describe('Nom de la simulation'),
  epci: z.array(z.object({ code: z.string().describe('Code EPCI (SIREN)') })).describe('Liste des EPCI'),
  scenario: z.object({
    b2_scenario: z.string().describe('Scénario démographique (central, haut, bas)'),
    projection: z.number().describe('Année de projection'),
    epcis: z
      .record(
        z.string(),
        z.object({
          b2_tx_rs: z.number().optional().describe('Taux résidences secondaires'),
          b2_tx_vacance: z.number().optional().describe('Taux vacance'),
          baseEpci: z.boolean().describe('EPCI de base pour le calcul'),
        }),
      )
      .describe('Paramétrage par EPCI (clé = code EPCI)'),
  }),
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
    b2_scenario: z.string(),
    projection: z.number(),
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
