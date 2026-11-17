'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
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

  // Même normalisation que côté serveur, qui rattache la simulation au groupe homonyme au lieu d'en créer un second.
  const normalized = value.trim().toLowerCase()
  const matchedGroup = normalized ? groups?.find((group) => group.name.trim().toLowerCase() === normalized) : undefined

  return (
    <>
      <Input
        label="Nom du groupe EPCI"
        hintText="Donnez un nom à cette sélection d'EPCI pour la réutiliser plus tard"
        nativeInputProps={{
          value,
          // Seul point de bascule auto → manuel : dès que l'utilisateur tape, le préremplissage ne réécrit plus.
          onChange: (e) => {
            setQueryStates({ epciGroupName: e.target.value, epciGroupNameAuto: null })
          },
          placeholder: 'Ex: Métropole du Grand Paris Est',
        }}
      />
      {matchedGroup && (
        <div className="fr-mt-2w">
          <Alert
            description={`Un groupe « ${matchedGroup.name} » existe déjà : votre scénario y sera rattaché et pourra être comparé aux autres scénarios de ce groupe.`}
            severity="info"
            small
          />
        </div>
      )}
    </>
  )
}
