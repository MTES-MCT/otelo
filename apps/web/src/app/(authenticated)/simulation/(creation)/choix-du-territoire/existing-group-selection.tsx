'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useEffect } from 'react'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { useEpciGroups } from '~/hooks/use-epci-groups'
import { TPlanningDocumentType } from '~/schemas/epci-group'
import { EpciGroupSelect } from './epci-group-select'
import { UrbanismeDocQuestion } from './urbanisme-doc-question'

const PLANNING_DOCUMENT_TYPE_LABELS: Record<TPlanningDocumentType, string> = {
  PLH_PLUI: 'PLH ou PLUi',
  SCOT: 'SCoT',
  AUTRES: 'Autre document',
}

export const ExistingGroupSelection = () => {
  const [{ epciGroupId, urbanismeDoc }, setQueryStates] = useQueryStates({
    baseEpci: parseAsString,
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    epciGroupName: parseAsString,
    epciGroupId: parseAsString,
    epciChart: parseAsString,
    urbanismeDoc: parseAsString,
    urbanismeDocType: parseAsString,
    urbanismeDocName: parseAsString,
  })
  const { data: groups } = useEpciGroups({ withActiveSimulations: true })
  const selectedGroup = groups?.find((group) => group.id === epciGroupId)
  // Un groupe qui porte déjà un document n'a rien à apprendre de la question : l'API ne ferait
  // qu'écraser son type et son nom avec une réponse redemandée.
  const hasPlanningDocument = selectedGroup?.worksOnPlanningDocument === true

  // Une réponse donnée pour un groupe précédent reste dans l'URL : elle serait reportée sur celui-ci.
  useEffect(() => {
    if (hasPlanningDocument && urbanismeDoc !== null) {
      void setQueryStates({ urbanismeDoc: null, urbanismeDocType: null, urbanismeDocName: null })
    }
  }, [hasPlanningDocument, urbanismeDoc, setQueryStates])

  return (
    <>
      <h3 className={fr.cx('fr-h5')}>Sélectionner un groupe EPCI sauvegardé</h3>
      <p className={fr.cx('fr-text--sm', 'fr-hint-text')}>Choisissez parmi vos groupes d'EPCI précédemment sauvegardés</p>
      <div {...tutorialAnchor('epci-group-select')}>
        <EpciGroupSelect
          selectedGroupId={epciGroupId}
          onUnselect={() => {
            setQueryStates({
              epciGroupId: null,
              epciGroupName: null,
              epcis: [],
              urbanismeDoc: null,
              urbanismeDocName: null,
              urbanismeDocType: null,
            })
          }}
        />
      </div>
      {/* Le nom vient du groupe sauvegardé : la question ne sert ici qu'à compléter un groupe qui n'a pas encore de document. */}
      {selectedGroup && hasPlanningDocument && (
        <p className={fr.cx('fr-px-3w', 'fr-pb-3w', 'fr-text--sm', 'fr-mb-0')}>
          <span className={fr.cx('fr-icon-file-text-line', 'fr-icon--sm', 'fr-mr-1v')} aria-hidden />
          Document d'urbanisme associé à ce territoire :{' '}
          <strong>
            {[
              selectedGroup.planningDocumentType && PLANNING_DOCUMENT_TYPE_LABELS[selectedGroup.planningDocumentType],
              selectedGroup.planningDocumentName,
            ]
              .filter(Boolean)
              .join(' – ') || 'oui'}
          </strong>
        </p>
      )}
      {selectedGroup && !hasPlanningDocument && (
        <div className={fr.cx('fr-px-3w', 'fr-pb-3w')} {...tutorialAnchor('urbanisme-doc-existing-group')}>
          <UrbanismeDocQuestion required={false} />
        </div>
      )}
    </>
  )
}
