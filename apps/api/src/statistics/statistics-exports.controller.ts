import { BadRequestException, Controller, Get, Param, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { sendCsv } from '~/common/utils/csv'
import { type DateRange, formatRangeForFilename, resolveDateRange } from '~/common/utils/date-range'
import { Role } from '~/generated/prisma/enums'
import { StatisticsExportsService } from './statistics-exports.service'

type DatasetDefinition = {
  label: string
  columns: string[]
  rows: (service: StatisticsExportsService, range: DateRange) => Promise<Array<Record<string, unknown>>>
}

/**
 * Catalogue des jeux de données exportables.
 *
 * Une seule route paramétrée plutôt qu'une route par jeu : la logique d'accès, de période,
 * d'encodage et de nommage de fichier est écrite une fois, et ajouter un export revient
 * à ajouter une entrée ici.
 */
const DATASETS: Record<string, DatasetDefinition> = {
  activation: {
    label: 'activation',
    columns: StatisticsExportsService.ACTIVATION_COLUMNS,
    rows: (service, range) => service.getActivation(range),
  },
  connexions: {
    label: 'connexions',
    columns: StatisticsExportsService.CONNECTIONS_COLUMNS,
    rows: (service, range) => service.getConnections(range),
  },
  'connexions-mensuelles': {
    label: 'connexions-mensuelles',
    columns: StatisticsExportsService.MONTHLY_CONNECTIONS_COLUMNS,
    rows: (service, range) => service.getMonthlyConnections(range),
  },
  api: {
    label: 'volumetrie-api',
    columns: StatisticsExportsService.API_USAGE_COLUMNS,
    rows: (service, range) => service.getApiUsage(range),
  },
  calculs: {
    label: 'performance-calculs',
    columns: StatisticsExportsService.CALCULATIONS_COLUMNS,
    rows: (service, range) => service.getCalculations(range),
  },
  dossiers: {
    label: 'dossiers-etudes',
    columns: StatisticsExportsService.EPCI_GROUPS_COLUMNS,
    rows: (service, range) => service.getEpciGroups(range),
  },
  exports: {
    label: 'exports-realises',
    columns: StatisticsExportsService.EXPORTS_COLUMNS,
    rows: (service, range) => service.getExports(range),
  },
  changements: {
    label: 'modifications-scenarios',
    columns: StatisticsExportsService.SIMULATION_CHANGES_COLUMNS,
    rows: (service, range) => service.getSimulationChanges(range),
  },
  feedbacks: {
    label: 'feedbacks',
    columns: StatisticsExportsService.FEEDBACKS_COLUMNS,
    rows: (service, range) => service.getFeedbacks(range),
  },
  partages: {
    label: 'partages',
    columns: StatisticsExportsService.SHARES_COLUMNS,
    rows: (service, range) => service.getShares(range),
  },
  retention: {
    label: 'retention',
    columns: StatisticsExportsService.RETENTION_COLUMNS,
    rows: (service, range) => service.getRetention(range),
  },
}

export const EXPORT_DATASET_KEYS = Object.keys(DATASETS)

@Controller('statistics/exports')
export class StatisticsExportsController {
  constructor(private readonly statisticsExportsService: StatisticsExportsService) {}

  /**
   * Les exports nominatifs (connexions, activation, retours) contiennent des données
   * personnelles : ils restent réservés aux administrateurs.
   */
  @AccessControl({ roles: [Role.ADMIN] })
  @Get(':dataset')
  async exportDataset(@Param('dataset') dataset: string, @Res() res: Response, @Query('from') from?: string, @Query('to') to?: string) {
    const definition = DATASETS[dataset]

    if (!definition) {
      throw new BadRequestException(`Jeu de données inconnu : "${dataset}". Valeurs attendues : ${EXPORT_DATASET_KEYS.join(', ')}`)
    }

    const range = resolveDateRange(from, to)
    const rows = await definition.rows(this.statisticsExportsService, range)

    sendCsv(res, rows, `${definition.label}-${formatRangeForFilename(range)}.csv`, definition.columns)
  }
}
