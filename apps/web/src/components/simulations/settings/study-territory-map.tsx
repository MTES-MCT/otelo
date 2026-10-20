'use client'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FC, useEffect, useMemo } from 'react'
import { GeoJSON, MapContainer, Tooltip, useMap } from 'react-leaflet'
import { IgnBasemapLayer } from '~/components/map/ign-basemap-layer'
import type { EpciData } from '~/components/simulations/results/summary/simulation-needs-summary-map'
import styles from './study-territory-map.module.css'

export type StudyTerritoryRole = 'searched' | 'bassin' | 'added'

const ROLE_STYLES: Record<StudyTerritoryRole, L.PathOptions> = {
  added: { color: '#C3992A', fillColor: '#FCC63A', fillOpacity: 0.35, weight: 2 },
  bassin: { color: '#6A6AF4', fillColor: '#6A6AF4', fillOpacity: 0.25, weight: 2 },
  searched: { color: '#000091', fillColor: '#000091', fillOpacity: 0.5, weight: 2 },
}

const ROLE_LABELS: Record<StudyTerritoryRole, string> = {
  added: 'EPCI ajouté',
  bassin: "Autre EPCI du bassin d'habitat",
  searched: 'EPCI recherché',
}

const FRANCE_CENTER: [number, number] = [46.6, 2.8]

const toFeature = (epci: EpciData): GeoJSON.Feature => ({ type: 'Feature', properties: {}, geometry: epci.contour as GeoJSON.Geometry })

const FitBounds: FC<{ contours: EpciData[] }> = ({ contours }) => {
  const map = useMap()

  useEffect(() => {
    const collection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: contours.map(toFeature),
    }
    const bounds = L.geoJSON(collection).getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 10 })
    }
  }, [map, contours])

  return null
}

type StudyTerritoryMapProps = {
  contours: EpciData[]
  getRole: (epciCode: string) => StudyTerritoryRole
}

/**
 * Carte du territoire d'étude : l'EPCI recherché, les autres EPCI de son bassin d'habitat et, le cas
 * échéant, les EPCI limitrophes ajoutés. Elle montre d'un coup d'œil pourquoi l'étude porte sur
 * plusieurs EPCI alors qu'on n'en a cherché qu'un.
 */
export const StudyTerritoryMap: FC<StudyTerritoryMapProps> = ({ contours, getRole }) => {
  const roles = useMemo(() => new Set(contours.map((epci) => getRole(epci.code))), [contours, getRole])

  return (
    <div>
      <div className={styles.map}>
        <MapContainer center={FRANCE_CENTER} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <IgnBasemapLayer />
          <FitBounds contours={contours} />
          {contours.map((epci) => {
            const role = getRole(epci.code)
            return (
              <GeoJSON
                // La clé porte le rôle : react-leaflet n'applique `style` qu'au montage.
                key={`${epci.code}-${role}`}
                data={toFeature(epci)}
                style={ROLE_STYLES[role]}
              >
                <Tooltip sticky>
                  <strong>{epci.nom}</strong>
                  <br />
                  <span className="fr-text--xs">{ROLE_LABELS[role]}</span>
                </Tooltip>
              </GeoJSON>
            )
          })}
        </MapContainer>
      </div>
      <ul className={styles.legend}>
        {(['searched', 'bassin', 'added'] as const)
          .filter((role) => roles.has(role))
          .map((role) => (
            <li key={role} className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ backgroundColor: ROLE_STYLES[role].fillColor }} aria-hidden />
              {ROLE_LABELS[role]}
            </li>
          ))}
      </ul>
    </div>
  )
}
