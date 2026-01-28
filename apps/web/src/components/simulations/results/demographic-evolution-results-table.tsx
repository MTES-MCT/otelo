import { fr } from '@codegouvfr/react-dsfr'
import Table from '@codegouvfr/react-dsfr/Table'
import { formatNumber } from '~/utils/format-numbers'

type DemographicEvolutionResultsTableProps = {
  results: {
    demographicEvolution: number
    renewalNeeds: number
    secondaryResidenceAccomodationEvolution: number
    totalFlux: number
    vacantAccomodationEvolution: number
    shortTermVacantAccomodation: number
    longTermVacantAccomodation: number
  }
}
export const DemographicEvolutionResultsTable = ({ results }: DemographicEvolutionResultsTableProps) => {
  return (
    <Table
      className="fr-mb-0"
      noCaption
      caption="Résumé des besoins en stock"
      data={[
        ['Démographie', formatNumber(results.demographicEvolution)],
        ['Logements vacants de courte durée - Fluidité du parc', formatNumber(results.shortTermVacantAccomodation)],
        [
          results.secondaryResidenceAccomodationEvolution < 0 ? 'Remobilisation de résidences secondaires' : 'Résidences secondaires',
          formatNumber(results.secondaryResidenceAccomodationEvolution),
        ],
        [
          results.longTermVacantAccomodation < 0 ? 'Remobilisation de logements vacants' : 'Logements vacants de longue durée',
          formatNumber(results.longTermVacantAccomodation),
        ],
        ['Renouvellement urbain - Disparition & Restructuration', formatNumber(results.renewalNeeds)],
        [<span className={fr.cx('fr-text--bold')}>Total</span>, formatNumber(results.totalFlux)],
      ]}
      fixed
      headers={['Catégorie', 'Besoin calculé']}
    />
  )
}
