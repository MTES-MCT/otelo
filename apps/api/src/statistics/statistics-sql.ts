import type { DateRange } from '~/common/utils/date-range'
import { Prisma } from '~/generated/prisma/client'
import { ownerIsNotTeam } from './team'

/** Période couvrant tout l'historique. */
export const ALL_TIME: DateRange = { from: new Date(0), toExclusive: new Date('9999-01-01T00:00:00.000Z') }

/**
 * Simulations exportées sur la période, qu'il s'agisse d'un PowerPoint ou d'un Excel.
 * Un export est le signe qu'un scénario sort d'Otelo pour servir ailleurs.
 *
 * `powerpointOnly` restreint au PowerPoint, document de restitution destiné à la
 * concertation : l'Excel est aussi produit en masse pour de l'analyse brute.
 */
export const simulationsExportedIn = ({ from, toExclusive }: DateRange, { powerpointOnly = false } = {}): Prisma.Sql => Prisma.sql`
  SELECT DISTINCT s.id, s.scenario_id, s.epci_group_id
  FROM exports e
  INNER JOIN simulations s ON s.id = e.simulation_id
  WHERE e.created_at >= ${from} AND e.created_at < ${toExclusive}
    ${powerpointOnly ? Prisma.sql`AND e.type = 'POWERPOINT'` : Prisma.empty}
    AND ${ownerIsNotTeam('s.user_id')}
`

/** Population du dernier recensement disponible pour chaque EPCI. */
export const LATEST_POPULATION = Prisma.sql`
  SELECT DISTINCT ON (epci_code) epci_code, population
  FROM rp
  ORDER BY epci_code, millesime DESC, year DESC
`
