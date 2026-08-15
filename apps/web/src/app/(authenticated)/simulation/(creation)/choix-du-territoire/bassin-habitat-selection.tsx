'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import { TEpci } from '@shared'
import { useRouter } from 'next/navigation'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useState } from 'react'
import { AutocompleteInput } from '~/components/simulations/autocomplete/autocomplete-input'
import { useEpciGroupNamePrefill } from '~/hooks/use-epci-group-name-prefill'
import { useEpcis } from '~/hooks/use-epcis'
import { GeoApiCommuneResult, GeoApiEpciResult } from '~/hooks/use-geoapi-search'
import { buildTerritoryLabel } from '~/utils/epci-group-name'
import { EpciGroupNameInput } from './epci-group-name-input'
import { UrbanismeDocQuestion } from './urbanisme-doc-question'

type BassinHabitatSelectionProps = {
  bassinEpcis: TEpci[]
  hasUrbanismeDocError?: boolean
}

export const BassinHabitatSelection = ({ bassinEpcis, hasUrbanismeDocError }: BassinHabitatSelectionProps) => {
  const router = useRouter()
  const [{ baseEpci, epcis, epciGroupName }, setQueryStates] = useQueryStates({
    baseEpci: parseAsString,
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    epciGroupName: parseAsString,
    epciGroupId: parseAsString,
    epciChart: parseAsString,
  })
  const { data: selectedEpcis, isLoading: isLoadingEpcis } = useEpcis(epcis)
  const [isBassinHabitat, setIsBassinHabitat] = useState(false)

  useEffect(() => {
    if (baseEpci && epcis.length === 0 && bassinEpcis.length > 0) {
      const isCorrectBassin = bassinEpcis.some((epci) => epci.code === baseEpci)
      if (isCorrectBassin) {
        setQueryStates({ epcis: bassinEpcis.map((epci) => epci.code) })
        setIsBassinHabitat(true)
      }
    }
  }, [baseEpci, epcis.length, bassinEpcis, setQueryStates])

  const onSelectEpci = async (item: GeoApiEpciResult | GeoApiCommuneResult) => {
    const code = 'codeEpci' in item ? (item.codeEpci ?? item.code) : item.code

    setIsBassinHabitat(true)
    await setQueryStates({ baseEpci: code, epciChart: code, epcis: [] })
    router.refresh()
  }

  const baseEpciData = bassinEpcis.find((epci) => epci.code === baseEpci) ?? selectedEpcis?.find((epci) => epci.code === baseEpci)

  useEpciGroupNamePrefill({
    bassinName: baseEpciData?.bassinName,
    territoryLabel: baseEpciData ? buildTerritoryLabel(baseEpciData.name, baseEpciData.bassinName) : '',
  })

  if (isLoadingEpcis) {
    return <div>Chargement en cours...</div>
  }

  return (
    <>
      <h3 className={fr.cx('fr-h5')}>Choisir un Bassin d'Habitat</h3>
      <p className={fr.cx('fr-text--sm', 'fr-hint-text')}>Recherchez un EPCI pour sélectionner automatiquement son bassin d'habitat</p>
      <AutocompleteInput
        searchCategory="territoire"
        label="Rechercher un EPCI"
        onClick={onSelectEpci}
        hintText="Saisissez le nom de l'EPCI pour charger automatiquement tous les EPCI de son bassin d'habitat."
        defaultValue={baseEpciData?.name}
      />

      {selectedEpcis && selectedEpcis.length > 0 && (
        <>
          <div className={fr.cx('fr-py-5w')}>
            {isBassinHabitat && (
              <Alert
                description="Les EPCI du bassin d'habitat ont été automatiquement sélectionnés et ne peuvent pas être modifiés."
                severity="info"
                small
                className={fr.cx('fr-mb-2w')}
              />
            )}
            Les territoires inclus dans la simulation sont :
            <ul>
              {selectedEpcis?.map((epci) => (
                <li key={epci.code}>{epci.name}</li>
              ))}
            </ul>
          </div>

          <UrbanismeDocQuestion hasError={hasUrbanismeDocError} />

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
