'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import { TEpci } from '@shared'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useState } from 'react'
import { AutocompleteInput } from '~/components/simulations/autocomplete/autocomplete-input'
import type { StudyTerritoryRole } from '~/components/simulations/settings/study-territory-map'
import { BASSIN_HABITAT_DEFINITION } from '~/components/simulations/tutorial/definitions'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { DefinitionTooltip } from '~/components/ui/definition-tooltip'
import { useEpciContours } from '~/hooks/use-epci-contours'
import { useEpciGroupNamePrefill } from '~/hooks/use-epci-group-name-prefill'
import { useEpcis } from '~/hooks/use-epcis'
import { GeoApiCommuneResult, GeoApiEpciResult } from '~/hooks/use-geoapi-search'
import { buildTerritoryLabel } from '~/utils/epci-group-name'
import { ContiguousEpcisCheckboxes } from './contiguous-epcis-checkboxes'
import { EpciGroupNameInput } from './epci-group-name-input'
import { UrbanismeDocQuestion } from './urbanisme-doc-question'

// Leaflet touche à `window` dès l'import : la carte ne se rend que côté client.
const StudyTerritoryMap = dynamic(
  () => import('~/components/simulations/settings/study-territory-map').then((mod) => mod.StudyTerritoryMap),
  { ssr: false },
)

type TerritorySearchSelectionProps = {
  bassinEpcis: TEpci[]
  hasUrbanismeDocError?: boolean
}

/**
 * Choix du territoire d'étude par recherche directe : l'utilisateur cherche son EPCI (ou une commune),
 * Otelo lui présente le bassin d'habitat complet.
 *
 * L'estimation se fait à l'échelle du bassin : ses EPCI sont cochés et verrouillés, pour qu'on ne
 * puisse pas, dans le parcours courant, ne garder que l'EPCI qui nous intéresse. Ajouter des EPCI
 * limitrophes — pour un SCoT qui déborde du bassin, par exemple — reste possible, en second niveau.
 */
export const TerritorySearchSelection = ({ bassinEpcis, hasUrbanismeDocError }: TerritorySearchSelectionProps) => {
  const router = useRouter()
  const [{ baseEpci, epcis, epciGroupName }, setQueryStates] = useQueryStates({
    baseEpci: parseAsString,
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    epciGroupName: parseAsString,
    epciChart: parseAsString,
  })
  const { data: selectedEpcis } = useEpcis(epcis)

  // Un EPCI hors de tout bassin connu est son propre territoire d'étude.
  const isBassinLoaded = !!baseEpci && bassinEpcis.some((epci) => epci.code === baseEpci)
  const studyEpcis: TEpci[] = isBassinLoaded ? bassinEpcis : (selectedEpcis?.filter((epci) => epci.code === baseEpci) ?? [])
  const studyEpciCodes = studyEpcis.map((epci) => epci.code)
  const hasAddedEpcis = epcis.some((code) => !studyEpciCodes.includes(code))
  const [isAddingEpcis, setIsAddingEpcis] = useState(hasAddedEpcis)
  const { data: contours } = useEpciContours(epcis)
  const getRole = useCallback(
    (code: string): StudyTerritoryRole => (code === baseEpci ? 'searched' : studyEpciCodes.includes(code) ? 'bassin' : 'added'),
    [baseEpci, studyEpciCodes.join(',')],
  )

  // Le bassin arrive du serveur après la recherche (`router.refresh`) : on le reporte alors dans l'URL.
  // Avant son arrivée, l'EPCI recherché est retenu seul ; les EPCI du bassin s'y ajoutent ensuite,
  // faute de quoi ils resteraient affichés cochés sans faire partie de la simulation.
  useEffect(() => {
    if (!baseEpci) return
    if (isBassinLoaded) {
      const missingCodes = bassinEpcis.map((epci) => epci.code).filter((code) => !epcis.includes(code))
      if (missingCodes.length > 0) void setQueryStates({ epcis: [...epcis, ...missingCodes] })
    } else if (epcis.length === 0) {
      void setQueryStates({ epcis: [baseEpci] })
    }
  }, [baseEpci, epcis, isBassinLoaded, bassinEpcis, setQueryStates])

  const onSelectEpci = async (item: GeoApiEpciResult | GeoApiCommuneResult) => {
    const code = 'codeEpci' in item ? (item.codeEpci ?? item.code) : item.code
    setIsAddingEpcis(false)
    await setQueryStates({ baseEpci: code, epciChart: code, epcis: [] })
    router.refresh()
  }

  const baseEpciData = bassinEpcis.find((epci) => epci.code === baseEpci) ?? selectedEpcis?.find((epci) => epci.code === baseEpci)

  // Le nom du bassin n'est proposé que si l'étude s'y tient : avec des EPCI ajoutés, ce n'en est plus un.
  useEpciGroupNamePrefill({
    bassinName: hasAddedEpcis ? undefined : baseEpciData?.bassinName,
    territoryLabel: baseEpciData ? buildTerritoryLabel(baseEpciData.name, hasAddedEpcis ? undefined : baseEpciData.bassinName) : '',
  })

  return (
    <>
      <div {...tutorialAnchor('epci-search')}>
        <AutocompleteInput
          searchCategory="territoire"
          label="Recherchez un EPCI ou une commune"
          onClick={onSelectEpci}
          hintText="Saisissez le nom de l'EPCI, le nom de la commune ou son code postal."
          defaultValue={baseEpciData?.name}
        />
      </div>

      {studyEpcis.length > 0 && (
        <>
          <div className="fr-mt-4w" {...tutorialAnchor('bassin-epcis')}>
            <Checkbox
              legend={
                isBassinLoaded ? (
                  <>
                    Votre étude portera sur le <strong>bassin d&apos;habitat</strong>{' '}
                    <DefinitionTooltip definition={BASSIN_HABITAT_DEFINITION} /> suivant :
                  </>
                ) : (
                  'Votre étude portera sur le territoire suivant :'
                )
              }
              options={studyEpcis.map((epci) => ({
                label: epci.name,
                nativeInputProps: { checked: true, disabled: true, readOnly: true, value: epci.code },
              }))}
            />
          </div>

          {contours.length > 0 && (
            <div className="fr-mb-4w">
              <StudyTerritoryMap contours={contours} getRole={getRole} />
            </div>
          )}

          {isAddingEpcis ? (
            <ContiguousEpcisCheckboxes epcis={studyEpcis} />
          ) : (
            <div className="fr-mb-4w" {...tutorialAnchor('add-epcis')}>
              <Button priority="secondary" size="small" onClick={() => setIsAddingEpcis(true)}>
                Ajouter des EPCI
              </Button>
            </div>
          )}

          <div {...tutorialAnchor('urbanisme-doc')}>
            <UrbanismeDocQuestion hasError={hasUrbanismeDocError} />
          </div>

          <hr className="fr-mt-3w" />
          <div {...tutorialAnchor('epci-group-name')}>
            <EpciGroupNameInput value={epciGroupName || ''} />
          </div>
        </>
      )}
    </>
  )
}
