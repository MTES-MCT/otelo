'use client'

import { RiIconClassName } from '@codegouvfr/react-dsfr'
import Tabs from '@codegouvfr/react-dsfr/Tabs'
import { parseAsString, useQueryState } from 'nuqs'
import { FC, ReactNode } from 'react'

type EpciTabsProps = {
  epcis: Array<{ code: string; name: string }>
  /** Contenu de l'onglet actif. En mode contrôlé, le DSFR ne monte que ce panneau-là. */
  renderTab: (epciCode: string) => ReactNode
}

/**
 * Onglets de paramétrage par EPCI, pilotés par `epciChart`.
 *
 * L'onglet actif vit dans l'URL et non dans l'état interne du composant DSFR : c'est ce qui permet à
 * la carte d'estimation de suivre le territoire en cours de paramétrage, et réciproquement au
 * sélecteur de la carte de déplacer l'onglet.
 */
export const EpciTabs: FC<EpciTabsProps> = ({ epcis, renderTab }) => {
  const [epciChart, setEpciChart] = useQueryState('epciChart', parseAsString)

  // `epciChart` peut porter une valeur absente de la liste (URL héritée, EPCI retiré du périmètre) :
  // le composant DSFR n'afficherait alors aucun panneau.
  const selectedTabId = epcis.find((epci) => epci.code === epciChart)?.code ?? epcis[0]?.code

  if (!selectedTabId) return null

  return (
    <Tabs
      classes={{ panel: 'fr-background-default--grey' }}
      selectedTabId={selectedTabId}
      onTabChange={(tabId) => setEpciChart(tabId)}
      tabs={epcis.map((epci) => ({
        iconId: 'ri-road-map-line' as RiIconClassName,
        label: epci.name,
        tabId: epci.code,
      }))}
    >
      {renderTab(selectedTabId)}
    </Tabs>
  )
}
