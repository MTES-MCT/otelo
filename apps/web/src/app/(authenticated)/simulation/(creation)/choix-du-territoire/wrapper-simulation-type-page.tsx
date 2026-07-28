'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { TEpci } from '@shared'
import classNames from 'classnames'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
import { Drawer } from '~/components/common/drawer'
import { ScotInfoTable } from '~/components/simulations/docurba/scot-info-table'
import { NextStepLink } from '~/components/simulations/settings/next-step-link'
import { useEpciGroups } from '~/hooks/use-epci-groups'
import { useEpcis } from '~/hooks/use-epcis'
import { BassinHabitatSelection } from './bassin-habitat-selection'
import classes from './choix-du-territoire.module.css'
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
  const { data: selectedEpcis } = useEpcis(epcis)
  const [selectedMethod, setSelectedMethod] = useState<SelectionMethod>(() => {
    if (epciGroupId) return 'existing-group'
    if (epcis.length > 0) return 'custom-selection'
    return null
  })

  const [isScotDrawerOpen, setIsScotDrawerOpen] = useState(false)

  const hasEpcis = !!epcis?.length
  const scotEpcis = (selectedEpcis ?? []).map(({ code, name }) => ({ code, name }))
  const hasSelectedEpcis = scotEpcis.length > 0

  // Le drawer s'ouvre de lui-même quand une sélection apparaît, puis reste à la main de l'utilisateur.
  // La ref est initialisée depuis l'URL pour ne pas rouvrir le drawer à chaque retour sur la page.
  const hadSelection = useRef(hasEpcis)
  useEffect(() => {
    if (hasSelectedEpcis && !hadSelection.current) setIsScotDrawerOpen(true)
    hadSelection.current = hasSelectedEpcis
  }, [hasSelectedEpcis])

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
            <div className={classNames(classes.actionsBar, fr.cx('fr-mb-3w'))}>
              <Button
                priority="tertiary no outline"
                iconId="fr-icon-refresh-line"
                iconPosition="left"
                size="small"
                onClick={() => handleMethodSelect(null)}
              >
                Changer de méthode de sélection
              </Button>

              {hasSelectedEpcis && (
                <Button
                  priority="tertiary no outline"
                  iconId="fr-icon-file-text-line"
                  iconPosition="left"
                  size="small"
                  onClick={() => setIsScotDrawerOpen(true)}
                >
                  Voir la planification territoriale
                </Button>
              )}
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

      {hasSelectedEpcis && (
        <Drawer isOpen={isScotDrawerOpen} onClose={() => setIsScotDrawerOpen(false)} title="Planification territoriale">
          <ScotInfoTable epcis={scotEpcis} bare />
        </Drawer>
      )}
    </>
  )
}
