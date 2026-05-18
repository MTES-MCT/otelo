'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'

export const LongTermVacancyAlert: FC = () => {
  const [queryStates] = useQueryStates({
    millesime: parseAsString,
    projection: parseAsInteger,
  })

  return (
    <Alert
      description={`Votre choix de taux de logements vacants longue durée équivaut à 100 logements résorbés sur la période ${queryStates.millesime || '2021'} - ${queryStates.projection}.`}
      severity="info"
      small
    />
  )
}
