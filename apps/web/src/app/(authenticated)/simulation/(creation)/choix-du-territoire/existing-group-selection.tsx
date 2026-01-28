'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { EpciGroupSelect } from './epci-group-select'

export const ExistingGroupSelection = () => {
  const [{ epciGroupId }, setQueryStates] = useQueryStates({
    baseEpci: parseAsString,
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    epciGroupName: parseAsString,
    epciGroupId: parseAsString,
    epciChart: parseAsString,
  })

  return (
    <>
      <h3 className={fr.cx('fr-h5')}>Sélectionner un groupe EPCI sauvegardé</h3>
      <p className={fr.cx('fr-text--sm', 'fr-hint-text')}>Choisissez parmi vos groupes d'EPCI précédemment sauvegardés</p>
      <EpciGroupSelect
        selectedGroupId={epciGroupId}
        onUnselect={() => {
          setQueryStates({
            epciGroupId: null,
            epciGroupName: null,
            epcis: [],
          })
        }}
      />
    </>
  )
}
