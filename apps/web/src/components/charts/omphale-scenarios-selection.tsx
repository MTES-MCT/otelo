'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons'
import classNames from 'classnames'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { FC, useEffect, useState } from 'react'
import styles from './charts.module.css'

export const OmphaleScenariosSelection: FC = () => {
  const [knowMore, setKnowMore] = useState(false)
  const [queryStates, setQueryStates] = useQueryStates({
    omphale: parseAsString,
    omphaleTouched: parseAsString,
    population: parseAsString,
    demographicEvolutionOmphaleCustomIds: parseAsArrayOf(parseAsString).withDefault([]),
  })

  const hasCustomData = queryStates.demographicEvolutionOmphaleCustomIds.length > 0
  const selectValue = hasCustomData ? 'Central_C' : queryStates.omphale

  useEffect(() => {
    if (selectValue) {
      setQueryStates({ omphale: selectValue })
    }
  }, [selectValue, setQueryStates])

  const scenarios = [
    {
      id: 'central',
      label: 'Décélération',
      value: 'Central_B',
    },
    {
      id: 'central',
      label: 'Tendanciel',
      value: 'Central_C',
    },
    {
      id: 'central',
      label: 'Accéléré',
      value: 'Central_H',
    },
    {
      id: 'basse',
      label: 'Décélération',
      value: 'PB_B',
    },
    {
      id: 'basse',
      label: 'Tendanciel',
      value: 'PB_C',
    },
    {
      id: 'basse',
      label: 'Accéléré',
      value: 'PB_H',
    },
    {
      id: 'haute',
      label: 'Décélération',
      value: 'PH_B',
    },
    {
      id: 'haute',
      label: 'Tendanciel',
      value: 'PH_C',
    },
    {
      id: 'haute',
      label: 'Accéléré',
      value: 'PH_H',
    },
  ]

  const handleChange = (value: string) => {
    setQueryStates({ omphale: value, omphaleTouched: null })
  }

  const filteredScenarios = scenarios.filter((scenario) => scenario.id === queryStates.population)

  const RADIO_OPTIONS = filteredScenarios.map((scenario) => ({
    label: scenario.label,
    nativeInputProps: {
      value: scenario.value,
      checked: queryStates.omphale === scenario.value,
      onChange: () => handleChange(scenario.value),
      disabled: hasCustomData,
    },
  }))

  const hasError = !queryStates.omphale && !hasCustomData && queryStates.omphaleTouched === 'true'

  return (
    <div className={styles.compactRadio}>
      <RadioButtons
        key={`omphale-${queryStates.omphale || 'none'}`}
        legend="Choisissez une projection d'évolution des ménages"
        orientation="horizontal"
        options={RADIO_OPTIONS}
        state={hasError ? 'error' : 'default'}
        stateRelatedMessage={hasError ? 'Veuillez sélectionner une projection de ménages pour continuer' : undefined}
        classes={{
          inputGroup: 'fr-radio-rich fr-width-full fr-height-full',
          content: classNames('fr-justify-content-space-between fr-flex', styles.noWrap),
        }}
        name="omphale-scenario"
      />
      <Button
        priority="tertiary no outline"
        iconPosition="right"
        iconId={knowMore ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
        onClick={() => setKnowMore(!knowMore)}
        size="small"
      >
        En savoir plus sur les hypothèses d'influence
      </Button>
      {knowMore && (
        <p className="fr-text--sm fr-text-mention--grey fr-mt-1v">
          Les scénarios d'évolution proposés sont basés sur votre choix de projection par population à l'étape précédente. Vous avez la
          possibilité de revenir à l'étape précèdente pour modifier votre choix de projection par population.
        </p>
      )}
    </div>
  )
}
