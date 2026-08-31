'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { TEpci } from '@shared'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useState } from 'react'
import { NextStepLink } from '~/components/simulations/settings/next-step-link'
import { useEpciGroups } from '~/hooks/use-epci-groups'
import { parseUrbanismeDocType } from '~/utils/epci-group-name'
import { BassinHabitatSelection } from './bassin-habitat-selection'
import { CustomSelection } from './custom-selection'
import { ExistingGroupSelection } from './existing-group-selection'
import { MethodSelectionCards, SelectionMethod } from './method-selection-cards'

type WrapperSimulationTypePageProps = {
  bassinEpcis: TEpci[]
}

export const WrapperSimulationTypePage = ({ bassinEpcis = [] }: WrapperSimulationTypePageProps) => {
  const [{ epcis, epciGroupName, epciGroupId, urbanismeDoc, urbanismeDocType, urbanismeDocName, territoireTouched }, setQueryStates] =
    useQueryStates({
      baseEpci: parseAsString,
      epcis: parseAsArrayOf(parseAsString).withDefault([]),
      epciGroupName: parseAsString,
      epciGroupNameAuto: parseAsString,
      epciGroupId: parseAsString,
      epciChart: parseAsString,
      territoireTouched: parseAsString,
      urbanismeDoc: parseAsString,
      urbanismeDocType: parseAsString,
      urbanismeDocName: parseAsString,
    })
  const { data: groups } = useEpciGroups({ withActiveSimulations: true })
  const [selectedMethod, setSelectedMethod] = useState<SelectionMethod>(() => {
    if (epciGroupId) return 'existing-group'
    if (epcis.length > 0) return 'custom-selection'
    return null
  })

  const hasEpcis = !!epcis?.length

  const isGroupNameTaken = groups?.some((group) => group.name.toLowerCase() === epciGroupName?.toLowerCase()) || false

  // Le document d'urbanisme conditionne le nom proposé : la question est obligatoire partout sauf sur
  // un groupe existant, qui porte déjà son nom et n'utilise la réponse que pour enrichir le groupe.
  const isUrbanismeDocRequired = selectedMethod !== 'existing-group'
  const docType = parseUrbanismeDocType(urbanismeDocType)
  const isUrbanismeDocAnswered =
    urbanismeDoc === 'non' || (urbanismeDoc === 'oui' && !!docType && (docType !== 'plh-plui' || !!urbanismeDocName?.trim()))

  const canGoNextStep =
    hasEpcis && !!(epciGroupName || epciGroupId) && !isGroupNameTaken && (!isUrbanismeDocRequired || isUrbanismeDocAnswered)
  const hasUrbanismeDocError = territoireTouched === 'true' && isUrbanismeDocRequired && !isUrbanismeDocAnswered
  const href = '/simulation/cadrage-temporel'

  const handleMethodSelect = (method: SelectionMethod) => {
    setSelectedMethod(method)
    if (method === null) {
      setQueryStates({
        epciGroupId: null,
        epciGroupName: null,
        epciGroupNameAuto: null,
        epcis: [],
        baseEpci: null,
        territoireTouched: null,
        urbanismeDoc: null,
        urbanismeDocName: null,
        urbanismeDocType: null,
      })
    }
  }

  return (
    <>
      <div
        className="fr-p-2w fr-px-md-5w fr-pb-md-5w fr-mb-2w shadow"
        style={{
          background: fr.colors.decisions.background.default.grey.default,
        }}
      >
        {!selectedMethod && (
          <MethodSelectionCards
            selectedMethod={selectedMethod}
            onMethodSelect={handleMethodSelect}
            existingGroupsCount={groups?.length || 0}
          />
        )}

        {selectedMethod && (
          <>
            <div className={fr.cx('fr-mb-3w')}>
              <Button
                priority="tertiary no outline"
                iconId="fr-icon-refresh-line"
                iconPosition="left"
                size="small"
                onClick={() => handleMethodSelect(null)}
              >
                Changer de méthode de sélection
              </Button>
            </div>

            {selectedMethod === 'existing-group' && <ExistingGroupSelection />}
            {selectedMethod === 'bassin-habitat' && (
              <BassinHabitatSelection bassinEpcis={bassinEpcis} hasUrbanismeDocError={hasUrbanismeDocError} />
            )}
            {selectedMethod === 'custom-selection' && (
              <CustomSelection bassinEpcis={bassinEpcis} hasUrbanismeDocError={hasUrbanismeDocError} />
            )}
          </>
        )}
      </div>

      <div className={fr.cx('fr-ml-auto', 'fr-my-1w')}>
        <NextStepLink href={href} query="epcis" isDisabled={!canGoNextStep} touchedQueryParam="territoireTouched" />
      </div>
    </>
  )
}
