'use client'

import { parseAsString, useQueryStates } from 'nuqs'
import { useEffect } from 'react'
import { useDataPackVersions } from '~/hooks/use-data-pack-versions'

/**
 * Amorce le paramètre `millesime` avec le pack de données actif.
 * Monté dans le layout de création : le sélecteur ne vit que sur l'étape de cadrage temporel,
 * alors que toutes les étapes en aval (démographie, taux, résultats) ont besoin du paramètre.
 */
export const MillesimeInitializer = () => {
  const { data: dataPackVersions } = useDataPackVersions()
  const [queryStates, setQueryStates] = useQueryStates({
    millesime: parseAsString,
  })

  const activeVersion = dataPackVersions?.find((dp) => dp.isActive)

  useEffect(() => {
    if (!queryStates.millesime && activeVersion) {
      setQueryStates({ millesime: activeVersion.millesime })
    }
  }, [activeVersion, queryStates.millesime, setQueryStates])

  return null
}
