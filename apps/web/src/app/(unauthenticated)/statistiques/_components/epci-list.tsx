import { Table } from '@codegouvfr/react-dsfr/Table'
import type { TPublicStatistics } from '@otelo/shared'
import styles from '../statistiques.module.css'
import { EPCI_STATUS_LABELS, formatInteger } from './format'

/** Alternative textuelle à la carte : tous les EPCI utilisateurs, y compris ceux absents du fond de carte. */
export function EpciList({ epcis }: { epcis: TPublicStatistics['epcis'] }) {
  if (epcis.length === 0) return null

  return (
    <details className={styles.disclosure}>
      <summary className="fr-link">Voir la liste des EPCI utilisateurs ({formatInteger(epcis.length)})</summary>
      <Table
        className="fr-mt-2w"
        caption="EPCI utilisateurs d'Otelo, par région et département"
        headers={['Région', 'Département', 'EPCI', 'Statut']}
        data={epcis.map((epci) => [epci.region, epci.department ?? '—', epci.name, EPCI_STATUS_LABELS[epci.status]])}
        bordered
      />
    </details>
  )
}
