'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { EpciGroupSelect } from './epci-group-select'
import { UrbanismeDocQuestion } from './urbanisme-doc-question'

export const ExistingGroupSelection = () => {
  const [{ epciGroupId }, setQueryStates] = useQueryStates({
    baseEpci: parseAsString,
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    epciGroupName: parseAsString,
    epciGroupId: parseAsString,
    epciChart: parseAsString,
    urbanismeDoc: parseAsString,
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
            urbanismeDoc: null,
          })
        }}
      />
      {/* Le nom vient du groupe sauvegardé : la question ne sert ici qu'à mettre le groupe à jour. */}
      {epciGroupId && (
        <div className={fr.cx('fr-px-3w', 'fr-pb-3w')}>
          <UrbanismeDocQuestion />
        </div>
      )}
    </>
  )
}
