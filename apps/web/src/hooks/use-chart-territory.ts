'use client'

import { ALL_EPCIS_KEY } from '@shared'
import { parseAsString, useQueryStates } from 'nuqs'
import { useCallback } from 'react'

/** Mode d'affichage des graphiques démographiques. Absent de l'URL = ensemble du territoire. */
const EPCI_SCOPE = 'epci'

/**
 * Territoire affiché par les graphiques démographiques : un EPCI, ou l'agrégat du périmètre.
 *
 * `chartScope` ne porte qu'un **mode**, jamais un code — même convention que [useEstimationScope].
 * C'est ce qui permet à `epciChart` de rester toujours un code EPCI valide : les onglets de taux,
 * la carte d'estimation et le didacticiel le lisent tel quel et n'auraient rien à faire d'un « all ».
 * Choisir l'ensemble du territoire ne déplace donc aucun de ces écrans ; choisir un EPCI, si.
 */
export const useChartTerritory = (epciCodes: string[]) => {
  const [{ chartScope, epciChart }, setQueryStates] = useQueryStates({
    chartScope: parseAsString,
    epciChart: parseAsString,
  })

  // Sur un périmètre d'un seul EPCI il n'y a rien à agréger : le `<select>` porterait une valeur
  // absente de ses options, et le navigateur retomberait silencieusement sur la première.
  const isAggregated = epciCodes.length > 1 && chartScope !== EPCI_SCOPE

  // `epciChart` peut porter un code hors périmètre (URL héritée, EPCI retiré) : on retombe sur le
  // premier plutôt que d'afficher un territoire inexistant.
  const focusedEpciCode = epciCodes.find((code) => code === epciChart) ?? epciCodes[0] ?? null
  const dataKey = isAggregated ? ALL_EPCIS_KEY : focusedEpciCode

  const setDisplayedTerritory = useCallback(
    (epciCode: string | null) => {
      setQueryStates(epciCode ? { chartScope: EPCI_SCOPE, epciChart: epciCode } : { chartScope: null })
    },
    [setQueryStates],
  )

  return { dataKey, focusedEpciCode, isAggregated, setDisplayedTerritory }
}
