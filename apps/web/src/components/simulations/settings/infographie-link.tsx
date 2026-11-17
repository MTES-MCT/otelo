'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { useChartTerritory } from '~/hooks/use-chart-territory'

/**
 * Accès à l'infographie depuis le parcours, dans un nouvel onglet pour ne pas perdre le paramétrage.
 *
 * L'infographie ne travaille qu'à l'échelle d'un EPCI : on y ouvre celui du graphique, ou à
 * défaut le premier du territoire, sur l'évolution passée de la population.
 */
export const InfographieLink: FC = () => {
  const [{ epcis }] = useQueryStates({ epcis: parseAsArrayOf(parseAsString).withDefault([]) })
  const { focusedEpciCode } = useChartTerritory(epcis)
  const query = focusedEpciCode
    ? `?${new URLSearchParams({ epci: focusedEpciCode, epcis: focusedEpciCode, epciChart: focusedEpciCode, type: 'population-evolution' })}`
    : ''

  return (
    <span {...tutorialAnchor('infographie-link')}>
      <Button
        priority="tertiary no outline"
        iconId="ri-bar-chart-box-line"
        size="small"
        linkProps={{ href: `/infographies${query}`, target: '_blank' }}
      >
        Consulter l'infographie du territoire
      </Button>
    </span>
  )
}
