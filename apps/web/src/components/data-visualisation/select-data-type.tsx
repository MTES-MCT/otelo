'use client'

import { Select } from '@codegouvfr/react-dsfr/Select'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { useTracking } from '~/hooks/use-tracking'

export const DATA_TYPE_OPTIONS = [
  { label: 'Evolution passée de la population', value: 'population-evolution' },
  { label: 'Evolution passée du nombre de ménages', value: 'menage-evolution' },
  { label: 'Projection en population', value: 'projection-population-evolution' },
  { label: 'Projection en ménages', value: 'projection-menages-evolution' },
  { label: 'Taille des ménages', value: 'taille-menages' },
  { label: 'Pyramide des âges', value: 'pyramide-des-ages' },
  { label: 'Résidences secondaires', value: 'residences-secondaires' },
  { label: 'Logements vacants', value: 'logements-vacants' },
  { label: 'Mal Logement', value: 'mal-logement' },
  { label: 'Données Sit@del', value: 'sitadel' },
]

export const SelectDataType: FC = () => {
  const { trackEvent } = useTracking()
  const [queryStates, setQueryStates] = useQueryStates({
    type: parseAsString,
    source: parseAsString.withDefault('rp'),
    millesime: parseAsString,
  })

  const handleChange = (value: string) => {
    if (value) {
      trackEvent({
        action: 'selection jeu de donnees',
        category: 'Infographie',
        name: DATA_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value,
      })
    }

    setQueryStates({ type: value, source: null, millesime: null })
  }

  return (
    <Select
      label="Choix du type de données à visualiser"
      className="fr-mb-0"
      nativeSelectProps={{
        onChange: (event) => handleChange(event.target.value),
        value: queryStates.type || '',
      }}
    >
      <option value="">Choix du type de données à visualiser</option>
      {DATA_TYPE_OPTIONS.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </Select>
  )
}
