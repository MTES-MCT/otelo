'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import Button from '@codegouvfr/react-dsfr/Button'
import { TEpci } from '@shared'
import { useRouter } from 'next/navigation'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useState } from 'react'
import { AutocompleteInput } from '~/components/simulations/autocomplete/autocomplete-input'
import { useEpciGroupNamePrefill } from '~/hooks/use-epci-group-name-prefill'
import { useEpcis } from '~/hooks/use-epcis'
import { GeoApiCommuneResult, GeoApiEpciResult } from '~/hooks/use-geoapi-search'
import { buildTerritoryLabel } from '~/utils/epci-group-name'
import { CheckboxEpcis } from './checkbox-epcis'
import { ContiguousEpcisCheckboxes } from './contiguous-epcis-checkboxes'
import { EpciGroupNameInput } from './epci-group-name-input'
import { UrbanismeDocQuestion } from './urbanisme-doc-question'

type CustomSelectionProps = {
  bassinEpcis: TEpci[]
}

export const CustomSelection = ({ bassinEpcis }: CustomSelectionProps) => {
  const router = useRouter()
  const [{ baseEpci, epcis, epciGroupName }, setQueryStates] = useQueryStates({
    baseEpci: parseAsString,
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    epciGroupName: parseAsString,
    epciGroupId: parseAsString,
    epciChart: parseAsString,
  })
  const { data: selectedEpcis, isLoading: isLoadingEpcis } = useEpcis(epcis)
  const [isEditing, setIsEditing] = useState(false)

  const toggleEditing = () => setIsEditing(!isEditing)

  const onSelectEpci = async (item: GeoApiEpciResult | GeoApiCommuneResult) => {
    const code = 'codeEpci' in item ? (item.codeEpci ?? item.code) : item.code
    setIsEditing(false)
    await setQueryStates({ baseEpci: code, epciChart: code, epcis: [code] })
    router.refresh()
  }

  const baseEpciData = bassinEpcis.find((epci) => epci.code === baseEpci) ?? selectedEpcis?.find((epci) => epci.code === baseEpci)

  // Pas de préfixe « Bassin » ici : la sélection est libre, même si elle recouvre tout un bassin d'habitat.
  useEpciGroupNamePrefill({ territoryLabel: baseEpciData ? buildTerritoryLabel(baseEpciData.name) : '' })

  if (isLoadingEpcis) {
    return <div>Chargement en cours...</div>
  }

  return (
    <>
      <h3 className={fr.cx('fr-h5')}>Créer une sélection personnalisée</h3>
      <AutocompleteInput
        label="Rechercher un EPCI"
        onClick={onSelectEpci}
        hintText="Saisissez le nom de l'EPCI du territoire concerné, ou par défaut, vous pouvez saisir le nom de la commune ou son code postal."
        defaultValue={baseEpciData?.name}
      />

      {selectedEpcis && selectedEpcis.length > 0 && (
        <>
          <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters', 'fr-grid-row--middle')}>
            <div className={fr.cx('fr-col-md-9')}>
              {!isEditing && (
                <div className={fr.cx('fr-py-5w')}>
                  Les territoires inclus dans la simulation sont :
                  <ul>
                    {selectedEpcis?.map((epci) => (
                      <li key={epci.code}>{epci.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {isEditing && (
                <div className={fr.cx('fr-py-5w')}>
                  <CheckboxEpcis epcis={bassinEpcis} legend="Sélection des territoires du bassin" />
                </div>
              )}
            </div>
            <div className={fr.cx('fr-col-md-3')}>
              <Button priority="secondary" onClick={toggleEditing}>
                Éditer les territoires inclus
              </Button>
            </div>
          </div>

          {isEditing && <ContiguousEpcisCheckboxes epcis={bassinEpcis} />}

          <UrbanismeDocQuestion />

          <hr className={fr.cx('fr-mt-3w')} />
          <EpciGroupNameInput value={epciGroupName || ''} />
          <div className={fr.cx('fr-mt-2w')}>
            <Alert
              description="Les résultats de votre simulation seront donnés à l'échelle de l'EPCI ou à l'échelle du bassin d'habitat."
              severity="info"
              small
            />
          </div>
        </>
      )}
    </>
  )
}
