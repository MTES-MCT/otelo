'use client'

import { Select } from '@codegouvfr/react-dsfr/Select'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'

export const DATA_TYPE_OPTIONS = [
  { label: 'Evolution passée de la population', value: 'population-evolution' },
  { label: 'Evolution passée du nombre de ménages', value: 'menage-evolution' },
  { label: 'Projection en population', value: 'projection-population-evolution' },
  { label: 'Projection en ménages', value: 'projection-menages-evolution' },
  { label: 'Taille des ménages', value: 'taille-menages' },
  { label: 'Résidences secondaires', value: 'residences-secondaires' },
  { label: 'Logements vacants', value: 'logements-vacants' },
  { label: 'Mal Logement', value: 'mal-logement' },
  { label: 'Données Sit@del', value: 'sitadel' },
]

export const SelectDataType: FC = () => {
  const [queryStates, setQueryStates] = useQueryStates({
    type: parseAsString,
    source: parseAsString.withDefault('rp'),
  })

  return (
    <Select
      label="Choix du type de données à visualiser"
      nativeSelectProps={{
        onChange: (event) => setQueryStates({ type: event.target.value, source: null }),
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
