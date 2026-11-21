import { z } from 'zod'

const ZAmfEpciCode = z.string().regex(/^\d{9}$/)

export const ZAmfEpciParams = z.object({ epciCode: ZAmfEpciCode })
export type TAmfEpciParams = z.output<typeof ZAmfEpciParams>

export const ZAmfAnswers = z.object({
  epciCode: ZAmfEpciCode,
  demography: z.enum(['plus', 'tendance', 'moins']),
  vacancy: z.enum(['prioritaire', 'parmi-autres', 'non']),
  badHousing: z.boolean(),
  secondaryResidences: z.enum(['hausse', 'stable', 'maitrise', 'recuperation']),
})
export const ZAmfCreateSimulationBody = ZAmfAnswers.extend({
  email: z.email().optional().describe('Facultatif : peut être renseigné après les résultats, avec les contacts'),
})

export type TAmfAnswers = z.output<typeof ZAmfAnswers>
export type TAmfCreateSimulationBody = z.output<typeof ZAmfCreateSimulationBody>

export const ZAmfRange = z
  .object({ min: z.number(), max: z.number() })
  .describe(
    'Fourchette annuelle arrondie, entre la simulation basse et la simulation haute ; une contribution négative a ses deux bornes ≤ 0',
  )
export type TAmfRange = z.output<typeof ZAmfRange>

export const ZAmfResult = z.object({
  baseYear: z.number(),
  horizon: z.number(),
  annual: ZAmfRange.nullable().describe('Logements à construire par an ; null quand aucun besoin supplémentaire'),
  contributions: z
    .object({
      households: ZAmfRange.nullable().describe('Évolution du nombre de ménages (signée)'),
      badHousing: ZAmfRange.nullable().describe('Résorption du mal-logement'),
      fluidity: z.number().nullable().describe('Logements disponibles pour faciliter les déménagements'),
      vacancyRemobilised: ZAmfRange.nullable().describe('Logements vacants remis en occupation (en moins à construire, bornes positives)'),
      secondaryResidences: ZAmfRange.nullable().describe('Évolution des résidences secondaires (signée)'),
    })
    .nullable()
    .describe('Contributions annuelles ; null quand aucun besoin supplémentaire'),
})
export type TAmfResult = z.output<typeof ZAmfResult>

export const ZAmfEpci = z.object({
  code: z.string(),
  name: z.string(),
  fragileProjection: z.boolean(),
  baseYear: z.number(),
  horizon: z.number(),
  population: z.number().nullable().describe("Population de l'EPCI au recensement de l'année de base"),
  recentEvolution: z
    .object({ fromYear: z.number(), toYear: z.number(), rate: z.number() })
    .nullable()
    .describe('Évolution de la population entre les deux derniers recensements, en fraction'),
  projectedPopulation: z.object({
    haute: z.number(),
    central: z.number(),
    basse: z.number().nullable(),
  }),
  secondaryResidencesShare: z.number().describe('Part des résidences secondaires dans le parc, en fraction'),
  secondaryResidencesCount: z.number().nullable().describe('Nombre approché de résidences secondaires (part × parc total Filocom)'),
  longTermVacancy: z.object({ count: z.number(), year: z.number() }).nullable().describe('Logements vacants depuis au moins deux ans'),
})
export type TAmfEpci = z.output<typeof ZAmfEpci>

export const ZAmfShareContactsBody = z.object({
  email: z.email().describe("E-mail de la personne ayant répondu au questionnaire, s'il n'a pas été donné à la création"),
  contacts: z.array(z.object({ role: z.string().trim().min(1).max(100), email: z.email() })).max(10),
})
export type TAmfShareContactsBody = z.output<typeof ZAmfShareContactsBody>

export const ZAmfCreateSimulationResponse = z.object({ leadId: z.uuid(), result: ZAmfResult })
export type TAmfCreateSimulationResponse = z.output<typeof ZAmfCreateSimulationResponse>
