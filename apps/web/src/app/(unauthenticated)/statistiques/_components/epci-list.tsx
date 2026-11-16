import { Table } from '@codegouvfr/react-dsfr/Table'
import type { TPublicStatistics } from '@otelo/shared'
import { formatInteger } from '~/utils/format-statistics'
import styles from '../statistiques.module.css'
import { EPCI_STATUS_LABELS } from './format'

/** Alternative textuelle à la carte : tous les EPCI étudiés, y compris ceux absents du fond de carte. */
export function EpciList({ epcis }: { epcis: TPublicStatistics['epcis'] }) {
  if (epcis.length === 0) return null
  const exported = epcis.filter((epci) => epci.status === 'EXPORTED').length

  return (
    <details className={styles.disclosure}>
      <summary className="fr-link">
        Voir la liste des EPCI utilisateurs ({formatInteger(epcis.length)} étudiés, dont {formatInteger(exported)} avec un scénario exporté)
      </summary>
      <Table
        className="fr-mt-2w"
        caption="EPCI étudiés avec Otelo, par statut"
        headers={['Région', 'Département', 'EPCI', 'Statut']}
        data={epcis.map((epci) => [epci.region, epci.department ?? '—', epci.name, EPCI_STATUS_LABELS[epci.status]])}
        bordered
      />
    </details>
  )
}
