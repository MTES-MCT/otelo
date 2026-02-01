'use client'

import { TEpciGeoData, TEpciNeighborWithGeo } from '@shared'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo, useRef } from 'react'
import { GeoJSON, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'

export interface TerritoiresVoisinsMapProps {
  epci: TEpciGeoData | null
  neighbors: TEpciNeighborWithGeo[]
  onTerritoryClick?: (code: string) => void
}

const FRANCE_CENTER: [number, number] = [46.6, 2.8]
const FRANCE_ZOOM = 6

const SELECTED_COLOR = '#000091'
const NEIGHBOR_COLOR = '#F95C5E'

function FitBoundsController({ epci, neighbors }: { epci: TEpciGeoData | null; neighbors: TEpciNeighborWithGeo[] }) {
  const map = useMap()

  useEffect(() => {
    const features: GeoJSON.Feature[] = [
      ...(epci ? [{ type: 'Feature' as const, properties: {}, geometry: epci.contour as GeoJSON.Geometry }] : []),
      ...neighbors
        .filter((n) => n.geo?.contour)
        .map((n) => ({
          type: 'Feature' as const,
          properties: {},
          geometry: n.geo!.contour as GeoJSON.Geometry,
        })),
    ]

    if (features.length === 0) return

    const featureCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    }

    const geoJsonLayer = L.geoJSON(featureCollection)
    const bounds = geoJsonLayer.getBounds()

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 })
    }
  }, [map, neighbors])

  return null
}

export const TerritoiresVoisinsMap = ({ epci, neighbors, onTerritoryClick }: TerritoiresVoisinsMapProps) => {
  const mapKey = useMemo(() => {
    const codes = [epci?.code, ...neighbors.map((n) => n.neighborEpciCode)].filter(Boolean).join('-')
    return codes || 'empty'
  }, [epci, neighbors])

  const selectedFeature = useMemo(() => {
    if (!epci) return null
    return {
      type: 'Feature' as const,
      properties: { code: epci.code, nom: epci.nom },
      geometry: epci.contour as GeoJSON.Geometry,
    }
  }, [epci])

  const neighborFeatures = useMemo(() => {
    return neighbors
      .filter((n) => n.geo?.contour)
      .map((n) => ({
        type: 'Feature' as const,
        properties: {
          code: n.neighborEpciCode,
          nom: n.geo?.nom ?? n.neighborEpci.name,
          rank: n.rank,
          score: n.score,
        },
        geometry: n.geo!.contour as GeoJSON.Geometry,
      }))
  }, [neighbors])

  return (
    <MapContainer key={mapKey} center={FRANCE_CENTER} zoom={FRANCE_ZOOM} style={{ height: '100%', width: '100%' }} zoomControl={true}>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitBoundsController epci={epci} neighbors={neighbors} />
      {neighborFeatures.map((feature) => (
        <NeighborLayer key={feature.properties.code} feature={feature} onTerritoryClick={onTerritoryClick} />
      ))}
      {selectedFeature && <SelectedLayer feature={selectedFeature} onTerritoryClick={onTerritoryClick} />}
    </MapContainer>
  )
}

function NeighborLayer({ feature, onTerritoryClick }: { feature: GeoJSON.Feature; onTerritoryClick?: (code: string) => void }) {
  const geoJsonRef = useRef<L.GeoJSON>(null)

  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.setStyle({
        color: NEIGHBOR_COLOR,
        fillColor: NEIGHBOR_COLOR,
        fillOpacity: 0.3,
        weight: 2,
      })
    }
  }, [])

  const props = feature.properties as { code: string; nom: string; rank: number; score: number }

  return (
    <GeoJSON
      ref={geoJsonRef}
      data={feature}
      style={{
        color: NEIGHBOR_COLOR,
        fillColor: NEIGHBOR_COLOR,
        fillOpacity: 0.3,
        weight: 2,
      }}
      eventHandlers={{
        click: () => onTerritoryClick?.(props.code),
      }}
    >
      <Tooltip sticky>
        <strong>{props.nom}</strong>
        <br />
        <span style={{ fontSize: '0.8em', color: '#666' }}>
          #{props.rank} - Similarité : {((1 - props.score) * 100).toFixed(1)} %
        </span>
      </Tooltip>
    </GeoJSON>
  )
}

function SelectedLayer({ feature, onTerritoryClick }: { feature: GeoJSON.Feature; onTerritoryClick?: (code: string) => void }) {
  const geoJsonRef = useRef<L.GeoJSON>(null)

  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.setStyle({
        color: SELECTED_COLOR,
        fillColor: SELECTED_COLOR,
        fillOpacity: 0.45,
        weight: 2,
      })
    }
  }, [])

  const props = feature.properties as { code: string; nom: string }

  return (
    <GeoJSON
      ref={geoJsonRef}
      data={feature}
      style={{
        color: SELECTED_COLOR,
        fillColor: SELECTED_COLOR,
        fillOpacity: 0.45,
        weight: 2,
      }}
      eventHandlers={{
        click: () => onTerritoryClick?.(props.code),
      }}
    >
      <Tooltip sticky>
        <strong>{props.nom}</strong>
        <br />
        <span style={{ fontSize: '0.8em', color: '#666' }}>EPCI sélectionné</span>
      </Tooltip>
    </GeoJSON>
  )
}
