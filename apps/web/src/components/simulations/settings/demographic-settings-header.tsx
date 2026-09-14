'use client'

import { Select } from '@codegouvfr/react-dsfr/Select'
import Tabs from '@codegouvfr/react-dsfr/Tabs'
import { ALL_EPCIS_KEY } from '@shared'
import classNames from 'classnames'
import { parseAsString, useQueryStates } from 'nuqs'
import { useRef } from 'react'
import { tss } from 'tss-react'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { useChartTerritory } from '~/hooks/use-chart-territory'
import { useEpcis } from '~/hooks/use-epcis'

type DemographicSettingsHeaderProps = {
  children: React.ReactNode[]
  epcis?: string[]
}

export const DemographicSettingsSelectEpci = ({ epcis }: { epcis?: string[] }) => {
  const { data: customEpcis } = useEpcis(epcis)
  const options = customEpcis?.filter((item) => !!item)

  const { dataKey, isAggregated, setDisplayedTerritory } = useChartTerritory(epcis ?? [])
  // On se fie à la prop plutôt qu'à `options`, résolu de façon asynchrone : l'option apparaîtrait
  // après coup, et le `<select>` changerait de contenu sous le curseur.
  const canAggregate = (epcis?.length ?? 0) > 1

  return (
    <div className="fr-flex fr-justify-content-end fr-align-items-end fr-flex-gap-2v" {...tutorialAnchor('territory-chart-select')}>
      <span className="fr-text--sm fr-mb-0">Territoire affiché :</span>
      <Select
        label={undefined}
        nativeSelectProps={{
          // Deux sélecteurs proposent « Ensemble du territoire » sur cette page : celui-ci pilote le
          // graphique, celui de la carte d'estimation pilote les chiffres.
          'aria-label': 'Territoire affiché sur le graphique',
          value: isAggregated ? ALL_EPCIS_KEY : (dataKey ?? ''),
          onChange: (event) => setDisplayedTerritory(event.target.value === ALL_EPCIS_KEY ? null : event.target.value),
        }}
      >
        {canAggregate && <option value={ALL_EPCIS_KEY}>Ensemble du territoire</option>}
        {(options || []).map((option) => (
          <option key={option?.code} value={option?.code}>
            {option?.name}
          </option>
        ))}
      </Select>
    </div>
  )
}

export const DemographicSettingsHeader = ({ children }: DemographicSettingsHeaderProps) => {
  const [queryState, setQueryState] = useQueryStates({
    population: parseAsString,
    scenario: parseAsString.withDefault('population'),
    populationTouched: parseAsString,
  })

  const tabsRef = useRef<HTMLDivElement>(null)
  const { classes } = useStyles({ population: queryState.population })
  const selectedTabId = queryState.scenario ?? 'population'

  const content = selectedTabId === 'population' ? children[0] : children[1]
  const isPopulationSelected = !!queryState.population

  const handleTabChange = (tabId: string) => {
    if (tabId === 'menages' && !isPopulationSelected) {
      setQueryState({ populationTouched: 'true' })
      return
    }
    setQueryState({ scenario: tabId === 'population' ? 'population' : 'menages' })
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Tabs
      ref={tabsRef}
      className="fr-mt-2w"
      label="Scénario de projection démographique"
      classes={{ tab: classes.tab, panel: 'fr-background-default--grey' }}
      selectedTabId={selectedTabId}
      onTabChange={handleTabChange}
      tabs={[
        {
          label: 'Projection de population',
          tabId: 'population',
        },
        {
          label: 'Projection de ménages',
          tabId: 'menages',
        },
      ]}
    >
      <div className={classNames(classes.container, 'fr-background-default--grey')}>{content}</div>
    </Tabs>
  )
}

const useStyles = tss.withParams<{ population: string | null }>().create(({ population }) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  title: {
    width: '75%',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tab: {
    '&:nth-of-type(2)': {
      cursor: !population ? 'not-allowed' : 'pointer',
      opacity: !population ? 0.5 : 1,
    },
  },
}))
