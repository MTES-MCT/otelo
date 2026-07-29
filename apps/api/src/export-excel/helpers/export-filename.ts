type ExportFilenameInput = {
  name: string
  epcis: Array<{ code: string; name: string }>
  epciGroup?: { name: string } | null
  scenario: { epciScenarios: Array<{ epciCode: string; baseEpci: boolean }> }
}

/**
 * Libellé du territoire d'une simulation, dans l'ordre de préférence de l'interface :
 * l'EPCI de base s'il est désigné, sinon le nom du groupe d'EPCI (cas d'un territoire
 * composé, où aucun `baseEpci` n'est positionné), sinon le premier EPCI.
 */
function getTerritoryLabel(simulation: ExportFilenameInput): string | undefined {
  const baseEpciCode = simulation.scenario.epciScenarios.find((epciScenario) => epciScenario.baseEpci)?.epciCode
  const baseEpciName = simulation.epcis.find((epci) => epci.code === baseEpciCode)?.name

  return baseEpciName ?? simulation.epciGroup?.name ?? simulation.epcis[0]?.name
}

/**
 * Construit le nom du fichier d'export. Les segments absents sont retirés plutôt
 * qu'interpolés, sans quoi le nom contient un « undefined » littéral.
 */
export function buildExportFilename(simulation: ExportFilenameInput): string {
  const segments = ['Votre scenario Otelo', getTerritoryLabel(simulation), simulation.name]

  return `${segments
    .map((segment) => segment?.trim())
    .filter(Boolean)
    .join(' - ')}.xlsx`
}
