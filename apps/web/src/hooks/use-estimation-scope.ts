'use client'

import { parseAsString, useQueryStates } from 'nuqs'
import { useCallback } from 'react'

/** Mode de portée de la carte d'estimation. Absent de l'URL = ensemble du territoire. */
const EPCI_SCOPE = 'epci'

/**
 * Portée de la carte d'estimation : l'ensemble du territoire, ou l'EPCI en cours de paramétrage.
 *
 * `estimationScope` ne porte qu'un **mode**, jamais un code : l'EPCI visé est toujours `epciChart`,
 * celui-là même que suivent les onglets de taux et les graphiques démographiques. La carte suit donc
 * le paramétrage sans qu'aucune synchronisation ne soit nécessaire, et choisir un EPCI depuis la
 * carte déplace réciproquement l'onglet.
 */
export const useEstimationScope = (epciCodes: string[]) => {
  const [{ estimationScope, epciChart }, setQueryStates] = useQueryStates({
    estimationScope: parseAsString,
    epciChart: parseAsString,
  })

  // `epciChart` peut porter une valeur absente du périmètre (URL héritée, EPCI retiré) : on retombe
  // sur le premier EPCI plutôt que de restreindre l'estimation à un territoire inexistant.
  const focusedEpciCode = epciCodes.find((code) => code === epciChart) ?? epciCodes[0] ?? null
  const scopedEpciCode = estimationScope === EPCI_SCOPE ? focusedEpciCode : null

  const setScope = useCallback(
    (epciCode: string | null) => {
      setQueryStates(epciCode ? { epciChart: epciCode, estimationScope: EPCI_SCOPE } : { estimationScope: null })
    },
    [setQueryStates],
  )

  return { scopedEpciCode, setScope }
}
