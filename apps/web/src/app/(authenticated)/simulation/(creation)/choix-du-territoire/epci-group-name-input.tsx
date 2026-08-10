'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { useEpciGroups } from '~/hooks/use-epci-groups'

type EpciGroupNameInputProps = {
  value: string
}

export const EpciGroupNameInput: FC<EpciGroupNameInputProps> = ({ value }) => {
  const [_, setQueryStates] = useQueryStates({
    epciGroupName: parseAsString,
    epciGroupNameAuto: parseAsString,
  })
  const { data: groups } = useEpciGroups()

  const isGroupNameTaken = groups?.some((group) => group.name.toLowerCase() === value.toLowerCase()) || false

  return (
    <Input
      label="Nom du groupe EPCI"
      hintText="Donnez un nom à cette sélection d'EPCI pour la réutiliser plus tard"
      state={isGroupNameTaken ? 'error' : 'default'}
      stateRelatedMessage={isGroupNameTaken ? 'Ce nom est déjà utilisé par un autre groupe' : undefined}
      nativeInputProps={{
        value,
        // Seul point de bascule auto → manuel : dès que l'utilisateur tape, le préremplissage ne réécrit plus.
        onChange: (e) => {
          setQueryStates({ epciGroupName: e.target.value, epciGroupNameAuto: null })
        },
        placeholder: 'Ex: Métropole du Grand Paris Est',
      }}
    />
  )
}
