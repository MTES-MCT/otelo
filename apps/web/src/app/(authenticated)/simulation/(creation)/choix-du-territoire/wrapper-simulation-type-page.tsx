'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { TEpci } from '@otelo/shared'
import classNames from 'classnames'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useState } from 'react'
import { Drawer } from '~/components/common/drawer'
import { ScotInfoTable } from '~/components/simulations/docurba/scot-info-table'
import { NextStepLink } from '~/components/simulations/settings/next-step-link'
import { useEpciGroups } from '~/hooks/use-epci-groups'
import { useEpcis } from '~/hooks/use-epcis'
import { ZUrbanismeDoc } from '~/schemas/urbanisme-doc'
import classes from './choix-du-territoire.module.css'
import { ExistingGroupSelection } from './existing-group-selection'
import { TerritorySearchSelection } from './territory-search-selection'

/** La recherche est l'entrée par défaut ; un groupe d'EPCI déjà enregistré reste accessible à côté. */
type SelectionMethod = 'search' | 'existing-group'

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
      urbanismeDoc: parseAsString,
      urbanismeDocType: parseAsString,
      urbanismeDocName: parseAsString,
      territoireTouched: parseAsString,
    })
  const { data: groups } = useEpciGroups({ withActiveSimulations: true })
  const { data: selectedEpcis } = useEpcis(epcis)
  const [selectedMethod, setSelectedMethod] = useState<SelectionMethod>(() => (epciGroupId ? 'existing-group' : 'search'))
  const hasExistingGroups = (groups?.length ?? 0) > 0

  const [isScotDrawerOpen, setIsScotDrawerOpen] = useState(false)

  const hasEpcis = !!epcis?.length
  const scotEpcis = (selectedEpcis ?? []).map(({ code, name }) => ({ code, name }))
  const hasSelectedEpcis = scotEpcis.length > 0

  // Le document d'urbanisme conditionne le nom proposé : la question est obligatoire partout sauf sur
  // un groupe existant, qui porte déjà son nom et n'utilise la réponse que pour enrichir le groupe.
  const isUrbanismeDocRequired = selectedMethod !== 'existing-group'
  const isUrbanismeDocAnswered = ZUrbanismeDoc.safeParse({ urbanismeDoc, urbanismeDocName, urbanismeDocType }).success

  const canGoNextStep = hasEpcis && !!(epciGroupName || epciGroupId) && (!isUrbanismeDocRequired || isUrbanismeDocAnswered)
  const hasUrbanismeDocError = territoireTouched === 'true' && isUrbanismeDocRequired && !isUrbanismeDocAnswered
  const href = '/simulation/cadrage-temporel'

  // Changer d'entrée repart d'une sélection vide : un groupe et une recherche ne se combinent pas.
  const handleMethodSelect = (method: SelectionMethod) => {
    setSelectedMethod(method)
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

  return (
    <>
      <div
        className="fr-p-2w fr-px-md-5w fr-pb-md-5w fr-mb-2w shadow"
        style={{
          background: fr.colors.decisions.background.default.grey.default,
        }}
      >
        {(hasExistingGroups || hasSelectedEpcis) && (
          <div className={classNames(classes.actionsBar, fr.cx('fr-mb-3w'))}>
            {selectedMethod === 'search' && hasExistingGroups && (
              <Button
                priority="tertiary no outline"
                iconId="fr-icon-folder-2-line"
                iconPosition="left"
                size="small"
                onClick={() => handleMethodSelect('existing-group')}
              >
                Utiliser un groupe d&apos;EPCI enregistré
              </Button>
            )}
            {selectedMethod === 'existing-group' && (
              <Button
                priority="tertiary no outline"
                iconId="fr-icon-search-line"
                iconPosition="left"
                size="small"
                onClick={() => handleMethodSelect('search')}
              >
                Rechercher un autre territoire
              </Button>
            )}

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
        )}

        {selectedMethod === 'existing-group' ? (
          <ExistingGroupSelection />
        ) : (
          <TerritorySearchSelection bassinEpcis={bassinEpcis} hasUrbanismeDocError={hasUrbanismeDocError} />
        )}
      </div>

      <div className={fr.cx('fr-ml-auto', 'fr-my-1w')}>
        <NextStepLink href={href} query="epcis" isDisabled={!canGoNextStep} touchedQueryParam="territoireTouched" />
      </div>

      {hasSelectedEpcis && (
        <Drawer isOpen={isScotDrawerOpen} onClose={() => setIsScotDrawerOpen(false)} title="Planification territoriale">
          <ScotInfoTable epcis={scotEpcis} bare />
        </Drawer>
      )}
    </>
  )
}
