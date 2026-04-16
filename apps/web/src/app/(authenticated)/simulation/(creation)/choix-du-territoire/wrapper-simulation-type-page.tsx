'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { TEpci } from '@shared'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useState } from 'react'
import { NextStepLink } from '~/components/simulations/settings/next-step-link'
import { useEpciGroups } from '~/hooks/use-epci-groups'
import { BassinHabitatSelection } from './bassin-habitat-selection'
import { CustomSelection } from './custom-selection'
import { ExistingGroupSelection } from './existing-group-selection'
import { MethodSelectionCards, SelectionMethod } from './method-selection-cards'

type WrapperSimulationTypePageProps = {
  bassinEpcis: TEpci[]
}

export const WrapperSimulationTypePage = ({ bassinEpcis = [] }: WrapperSimulationTypePageProps) => {
  const [{ epcis, epciGroupName, epciGroupId }, setQueryStates] = useQueryStates({
    baseEpci: parseAsString,
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    epciGroupName: parseAsString,
    epciGroupId: parseAsString,
    epciChart: parseAsString,
  })
  const { data: groups } = useEpciGroups({ withActiveSimulations: true })
  const [selectedMethod, setSelectedMethod] = useState<SelectionMethod>(() => {
    if (epciGroupId) return 'existing-group'
    if (epcis.length > 0) return 'custom-selection'
    return null
  })

  const hasEpcis = !!epcis?.length

  const isGroupNameTaken = groups?.some((group) => group.name.toLowerCase() === epciGroupName?.toLowerCase()) || false
  const canGoNextStep = hasEpcis && !!(epciGroupName || epciGroupId) && !isGroupNameTaken
  const href = '/simulation/cadrage-temporel'

  const handleMethodSelect = (method: SelectionMethod) => {
    setSelectedMethod(method)
    if (method === null) {
      setQueryStates({
        epciGroupId: null,
        epciGroupName: null,
        epcis: [],
        baseEpci: null,
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
            {selectedMethod === 'bassin-habitat' && <BassinHabitatSelection bassinEpcis={bassinEpcis} />}
            {selectedMethod === 'custom-selection' && <CustomSelection bassinEpcis={bassinEpcis} />}
          </>
        )}
      </div>

      <div className={fr.cx('fr-ml-auto', 'fr-my-1w')}>
        <NextStepLink href={href} query="epcis" isDisabled={!canGoNextStep} />
      </div>
    </>
  )
}
