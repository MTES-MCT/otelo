'use client'

import Select from '@codegouvfr/react-dsfr/SelectNext'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useEffect } from 'react'
import { tss } from 'tss-react'

type SelectOmphaleProps = {
  onChange?: (value: string) => void
}

export const SelectOmphale = ({ onChange }: SelectOmphaleProps) => {
  const { classes } = useStyles()
  const [queryStates, setQueryStates] = useQueryStates({
    omphale: parseAsString,
    population: parseAsString,
    demographicEvolutionOmphaleCustomIds: parseAsArrayOf(parseAsString).withDefault([]),
  })
  const hasCustomData = queryStates.demographicEvolutionOmphaleCustomIds.length > 0
  const selectValue = hasCustomData ? 'Central_C' : queryStates.omphale

  useEffect(() => {
    if (selectValue) {
      setQueryStates({ omphale: selectValue })
    }
  }, [selectValue])

  const scenarios = [
    {
      id: 'central',
      label: 'Scénario de Décohabitation: Décélération',
      value: 'Central_B',
    },
    {
      id: 'central',
      label: 'Scénario de Décohabitation: Tendanciel',
      value: 'Central_C',
    },
    {
      id: 'central',
      label: 'Scénario de Décohabitation: Accélération',
      value: 'Central_H',
    },
    {
      id: 'basse',
      label: 'Scénario de Décohabitation: Décélération',
      value: 'PB_B',
    },
    {
      id: 'basse',
      label: 'Scénario de Décohabitation: Tendanciel',
      value: 'PB_C',
    },
    {
      id: 'basse',
      label: 'Scénario de Décohabitation: Accélération',
      value: 'PB_H',
    },
    {
      id: 'haute',
      label: 'Scénario de Décohabitation: Décélération',
      value: 'PH_B',
    },
    {
      id: 'haute',
      label: 'Scénario de Décohabitation: Tendanciel',
      value: 'PH_C',
    },
    {
      id: 'haute',
      label: 'Scénario de Décohabitation: Accélération',
      value: 'PH_H',
    },
  ]

  const handleChange = (value: string) => {
    if (onChange) {
      onChange(value)
    }
    setQueryStates({ omphale: value })
  }
  const filteredScenarios = scenarios.filter((scenario) => scenario.id === queryStates.population)
  return (
    <Select
      label="Scénario de projection de population"
      hint="Le choix de scénario s'applique au global dans votre simulation, à l'échelle du bassin d'habitat ou des EPCI."
      className={classes.select}
      placeholder="Choix du scénario"
      nativeSelectProps={{
        onChange: (event) => handleChange(event.target.value),
        value: selectValue || '',
      }}
      options={filteredScenarios}
      disabled={hasCustomData}
    />
  )
}

const useStyles = tss.create({
  select: {
    marginTop: '1rem',
  },
})
