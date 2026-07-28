'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons'
import classNames from 'classnames'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC, useState } from 'react'
import { MillesimeReminder } from '~/components/simulations/settings/millesime-reminder'
import styles from './charts.module.css'

// `availableScenarios` liste les projections de population disponibles pour
// TOUS les EPCI du bassin d'habitat (intersection). Non fourni = toutes
// disponibles (rétro-compatible). Les scénarios absents pour au moins un EPCI
// sont désactivés plutôt que masqués, pour rester visibles.
export const PopulationScenariosSelection: FC<{ availableScenarios?: string[] }> = ({ availableScenarios }) => {
  const [queryState, setQueryState] = useQueryStates({
    population: parseAsString,
    populationTouched: parseAsString,
  })
  const [knowMore, setKnowMore] = useState(false)

  const setPopulation = (value: string) => {
    setQueryState({ population: value, populationTouched: null })
  }

  const isAvailable = (value: string) => !availableScenarios || availableScenarios.includes(value)

  const RADIO_OPTIONS = [
    {
      label: 'Basse',
      nativeInputProps: {
        value: 'basse',
        checked: queryState.population === 'basse',
        onChange: () => setPopulation('basse'),
        disabled: !isAvailable('basse'),
      },
    },
    {
      label: 'Centrale',
      nativeInputProps: {
        value: 'central',
        checked: queryState.population === 'central',
        onChange: () => setPopulation('central'),
        disabled: !isAvailable('central'),
      },
    },
    {
      label: 'Haute',
      nativeInputProps: {
        value: 'haute',
        checked: queryState.population === 'haute',
        onChange: () => setPopulation('haute'),
        disabled: !isAvailable('haute'),
      },
    },
  ]

  const hasError = !queryState.population && queryState.populationTouched === 'true'

  const unavailableLabels = RADIO_OPTIONS.filter((o) => !isAvailable(o.nativeInputProps.value)).map((o) => o.label)

  return (
    <div className={styles.compactRadio}>
      {unavailableLabels.length > 0 && (
        <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
          {unavailableLabels.length > 1
            ? `Les scénarios ${unavailableLabels.join(', ')} ne sont pas disponibles pour au moins un EPCI du bassin d'habitat (projection INSEE manquante).`
            : `Le scénario ${unavailableLabels[0]} n'est pas disponible pour au moins un EPCI du bassin d'habitat (projection INSEE manquante).`}
        </p>
      )}
      <RadioButtons
        key={`population-${queryState.population || 'none'}`}
        legend="Choisissez une projection d'évolution de la population"
        orientation="horizontal"
        options={RADIO_OPTIONS}
        name="population-scenario"
        state={hasError ? 'error' : 'default'}
        stateRelatedMessage={hasError ? 'Veuillez sélectionner une projection de population pour continuer' : undefined}
        classes={{
          inputGroup: 'fr-radio-rich fr-width-full fr-height-full',
          content: classNames('fr-justify-content-space-between fr-flex', styles.noWrap),
        }}
      />
      <MillesimeReminder />
      <div data-chart-download-exclude>
        <Button
          priority="tertiary no outline"
          iconPosition="right"
          iconId={knowMore ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
          onClick={() => setKnowMore(!knowMore)}
          size="small"
        >
          En savoir plus sur les hypothèses
        </Button>
        {knowMore && (
          <p className="fr-text--sm fr-text-mention--grey fr-mt-1v">
            Les projections de population municipale proposées par Otelo sont établies à partir du modèle Omphale, produit par l'Insee. Il
            permet d'obtenir des projections de population sur la période 2018-2050 à partir de scénarios qui reposent sur différentes
            hypothèses de natalité, de mortalité et de migration. Ces projections de population sont ensuite transformées en projections de
            nombre de ménages à l'aide d'une méthode conçue par l'Insee et le SDES selon plusieurs scénarios de décohabitation. Les
            projections sont recalées à la dernière valeur observée, issue du recensement de la population
          </p>
        )}
      </div>
    </div>
  )
}
