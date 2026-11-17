'use client'

import { parseAsString, useQueryStates } from 'nuqs'
import { useEpciGroups } from '~/hooks/use-epci-groups'
import { useEpcis } from '~/hooks/use-epcis'

type EstimationTerritory = {
  /** Nom du territoire affiché sous le titre de la carte, `null` tant qu'aucun nom n'est connu. */
  groupLabel: string | null
  /** Les EPCI du périmètre, dans l'ordre de l'API, pour alimenter le sélecteur de portée. */
  epciOptions: Array<{ code: string; name: string }>
}

/**
 * Libellé du territoire pour le parcours de création.
 *
 * Le nom saisi ou proposé à l'étape 1 est prioritaire — c'est un nom choisi, pas un libellé calculé —
 * mais il n'existe pas toujours : le parcours « groupe existant » ne pose que `epciGroupId`. On
 * retombe alors sur le nom du groupe, puis sur un libellé dérivé des EPCI réellement sélectionnés,
 * repris de ce que le parcours de modification calcule côté serveur.
 */
export const useEstimationTerritory = (epciCodes: string[]): EstimationTerritory => {
  const [{ baseEpci, epciGroupId, epciGroupName }] = useQueryStates({
    baseEpci: parseAsString,
    epciGroupId: parseAsString,
    epciGroupName: parseAsString,
  })

  const { data: epcis } = useEpcis(epciCodes.length > 0 ? epciCodes : undefined)
  const { data: epciGroups } = useEpciGroups()

  const epciOptions = (epcis ?? []).filter((epci) => epciCodes.includes(epci.code)).map((epci) => ({ code: epci.code, name: epci.name }))

  const baseEpciName = epciOptions.find((epci) => epci.code === baseEpci)?.name ?? epciOptions[0]?.name
  const otherEpcisCount = epciOptions.length - 1
  const derivedLabel = baseEpciName ? `${baseEpciName}${otherEpcisCount > 0 ? ` + ${otherEpcisCount} EPCI` : ''}` : null

  const groupName = epciGroupId ? (epciGroups?.find((group) => group.id === epciGroupId)?.name ?? null) : null

  return { epciOptions, groupLabel: epciGroupName || groupName || derivedLabel }
}
