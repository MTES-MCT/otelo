'use client'

import { Select } from '@codegouvfr/react-dsfr/Select'
import classNames from 'classnames'
import { useState } from 'react'
import { AutocompleteInput } from '~/components/simulations/autocomplete/autocomplete-input'
import { useEpciNeighbors } from '~/hooks/use-epci-neighbors'
import { GeoApiCommuneResult, GeoApiEpciResult } from '~/hooks/use-geoapi-search'
import styles from './territoires-voisins.module.css'
import { TerritoiresVoisinsMapWrapper } from './territoires-voisins-map-wrapper'
import { TerritoiresVoisinsTable } from './territoires-voisins-table'

type CategoryType = 'gen' | 'logvac' | 'mlgmt' | 'projdem' | 'ressec'

const CATEGORY_LABELS: Record<CategoryType, string> = {
  gen: 'Général',
  logvac: 'Logements vacants',
  mlgmt: 'Mal-logement',
  projdem: 'Projections démographiques',
  ressec: 'Résidences secondaires',
}

const CATEGORY_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: 'gen', label: 'Général' },
  { value: 'logvac', label: 'Logements vacants' },
  { value: 'mlgmt', label: 'Mal-logement' },
  { value: 'projdem', label: 'Projections démographiques' },
  { value: 'ressec', label: 'Résidences secondaires' },
]

export const TerritoiresVoisinsPage = () => {
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [category, setCategory] = useState<CategoryType>('gen')
  // const [modalEpci, setModalEpci] = useState<TEpciNeighborWithGeo | null>(null)

  const { epci, neighbors, isLoading } = useEpciNeighbors(selectedCode, category)

  const handleEpciSelect = (item: GeoApiEpciResult | GeoApiCommuneResult) => {
    const code = 'codeEpci' in item ? (item.codeEpci ?? item.code) : item.code
    setSelectedCode(code)
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value as CategoryType)
  }

  // const handleTerritoryClick = (code: string) => {
  //   const neighbor = neighbors.find((n) => n.neighborEpciCode === code)
  //   if (neighbor) {
  //     setModalEpci(neighbor)
  //   }
  // }

  // const handleRowClick = (neighbor: TEpciNeighborWithGeo) => {
  //   setModalEpci(neighbor)
  // }

  const hasData = neighbors.length > 0

  return (
    <div className={classNames('fr-container', styles.pageContainer)}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Territoires voisins</h1>
        <p className={classNames('fr-text-mention--grey', styles.headerDescription)}>
          Explorez les EPCI les plus proches de votre territoire selon différentes dimensions socio-démographiques. Sélectionnez un EPCI et
          une catégorie pour visualiser ses territoires voisins sur la carte.
        </p>
      </div>

      <div
        className={classNames(
          'fr-flex fr-flex-gap-6v fr-justify-content-space-between fr-align-items-center fr-flex-wrap',
          styles.controls,
        )}
      >
        <div className="fr-flex-grow-1 fr-flex-basis-0">
          <AutocompleteInput
            hintText="Recherchez un EPCI par nom ou une commune par nom / code postal"
            label="Territoire"
            onClick={handleEpciSelect}
          />
        </div>
        <div className="fr-flex-grow-1 fr-flex-basis-0">
          <Select
            label="Catégorie de proximité"
            hint="Les différentes catégories de proximité sont général, logement vacants, mal-logement, projections démographiques et résidences secondaires"
            nativeSelectProps={{
              value: category,
              onChange: handleCategoryChange,
            }}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className={styles.mapSection}>
        {isLoading && (
          <div className={classNames('fr-flex fr-align-items-center fr-justify-content-center', styles.loadingOverlay)}>
            <p>Chargement des territoires...</p>
          </div>
        )}
        <div className={classNames('fr-width-full', styles.mapContainer)}>
          <TerritoiresVoisinsMapWrapper epci={epci} neighbors={neighbors} />
        </div>
        {hasData && (
          <div className={classNames('fr-flex fr-flex-gap-6v fr-align-items-center fr-flex-wrap', styles.legend)}>
            <div className="fr-flex fr-align-items-center fr-flex-gap-2v fr-text--sm">
              <span className={styles.legendSwatch} style={{ background: '#000091' }} />
              <span>EPCI sélectionné</span>
            </div>
            <div className="fr-flex fr-align-items-center fr-flex-gap-2v fr-text--sm">
              <span className={styles.legendSwatch} style={{ background: '#F95C5E' }} />
              <span>Territoires voisins</span>
            </div>
            <div className="fr-flex fr-align-items-center fr-flex-gap-2v fr-text--sm fr-text-mention--grey" style={{ marginLeft: 'auto' }}>
              Catégorie : <strong>{CATEGORY_LABELS[category]}</strong>
            </div>
          </div>
        )}
      </div>

      {hasData && (
        <div className={styles.neighborsList}>
          <TerritoiresVoisinsTable neighbors={neighbors} category={category} />
        </div>
      )}

      {/* TODO: re-enable modal when data is ready */}
      {/* {modalEpci && (
        <TerritoiresVoisinsModal
          epci={modalEpci}
          category={category}
          categoryLabel={CATEGORY_LABELS[category]}
          isReference={modalEpci.epciCode === selectedCode}
          onClose={() => setModalEpci(null)}
        />
      )} */}
    </div>
  )
}
