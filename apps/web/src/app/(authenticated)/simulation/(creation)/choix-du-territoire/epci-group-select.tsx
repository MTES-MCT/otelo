'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { FC, ReactNode } from 'react'
import { GenericCard } from '~/components/common/generic-card/generic-card'
import { useEpciGroups } from '~/hooks/use-epci-groups'
import { TEpciGroupWithEpcis } from '~/schemas/epci-group'

type EpciGroupSelectProps = {
  selectedGroupId?: string | null
  onUnselect?: () => void
}

// Container wrapper component to avoid repetition
const SelectContainer: FC<{ children: ReactNode }> = ({ children }) => <div className={fr.cx('fr-p-3w')}>{children}</div>

export const EpciGroupSelect: FC<EpciGroupSelectProps> = ({ selectedGroupId, onUnselect: onUnselectProp }) => {
  const [_, setQueryStates] = useQueryStates({
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    epciGroupName: parseAsString,
    epciGroupId: parseAsString,
  })
  const { data: groups, isLoading, error } = useEpciGroups()

  const onSelect = (group: TEpciGroupWithEpcis) => {
    setQueryStates({
      epcis: group.epciGroupEpcis.map((e) => e.epciCode),
      epciGroupName: null,
      epciGroupId: group.id,
    })
  }

  const onUnselect = () => {
    if (onUnselectProp) {
      onUnselectProp()
    } else {
      setQueryStates({
        epciGroupId: null,
        epciGroupName: null,
        epcis: [],
      })
    }
  }

  if (isLoading) {
    return (
      <SelectContainer>
        <p>Chargement des groupes EPCI...</p>
      </SelectContainer>
    )
  }

  if (error) {
    return (
      <SelectContainer>
        <Alert severity="error" description="Erreur lors du chargement des groupes EPCI" small />
      </SelectContainer>
    )
  }

  if (!groups || groups.length === 0) {
    return (
      <SelectContainer>
        <p className={fr.cx('fr-text--sm')}>Aucun groupe EPCI sauvegardé</p>
      </SelectContainer>
    )
  }

  return (
    <SelectContainer>
      <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
        {groups.map((group) => (
          <div key={group.id} className={fr.cx('fr-col-12', 'fr-col-md-6')}>
            <GenericCard
              title={group.name}
              description={
                <ul className={fr.cx('fr-text--xs', 'fr-m-0')}>
                  {group.epciGroupEpcis.map((epciGroup) => (
                    <li key={epciGroup.epciCode}>{epciGroup.epci.name}</li>
                  ))}
                </ul>
              }
              onClick={() => {
                if (selectedGroupId === group.id) {
                  onUnselect()
                } else {
                  onSelect(group)
                }
              }}
              selected={selectedGroupId === group.id}
            />
          </div>
        ))}
      </div>
    </SelectContainer>
  )
}
