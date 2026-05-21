'use client'

import 'leaflet/dist/leaflet.css'
import classNames from 'classnames'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { EpciCoverageItem } from '~/hooks/use-pilotage-epcis-coverage'
import styles from './pilotage-deployment-map.module.css'

export type MapColorMode = 'scenarios' | 'score' | 'exports'

const FRANCE_CENTER: [number, number] = [46.5, 2.3]
const FRANCE_ZOOM = 5
const FRANCE_BBOX: [[number, number], [number, number]] = [
  [41.2, -5.2],
  [51.1, 9.6],
]

const COLOR_HIGH = '#000091'
const COLOR_MEDIUM = '#7373FF'
const COLOR_LOW = '#C4C4F1'
const COLOR_NONE = '#CCCCCC'

const GEOJSON_BY_TYPE: Record<string, string> = {
  AgenceUrbanisme: '/geojson/AU_regroupees.geojson',
  SCOTPETR: '/geojson/scot.geojson',
}
const DEFAULT_GEOJSON = '/geojson/epci-1000m.geojson'

function getGeoJsonUrl(userType?: string | null, isAdmin?: boolean): string {
  if (!isAdmin) return DEFAULT_GEOJSON
  return (userType && GEOJSON_BY_TYPE[userType]) ?? DEFAULT_GEOJSON
}

function getBboxFromFeatures(features: GeoJSON.Feature[]): [[number, number], [number, number]] | null {
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity

  function processCoords(coords: unknown): void {
    if (!Array.isArray(coords)) return
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords as [number, number]
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
    } else {
      for (const c of coords) processCoords(c)
    }
  }

  for (const f of features) {
    if (f.geometry) processCoords((f.geometry as { coordinates: unknown }).coordinates)
  }

  return isFinite(minLat)
    ? [
        [minLat, minLng],
        [maxLat, maxLng],
      ]
    : null
}

function getIntensityColor(value: number, maxValue: number): { fill: string; stroke: string; opacity: number } {
  if (value === 0 || maxValue === 0) return { fill: COLOR_NONE, stroke: '#999999', opacity: 0.3 }
  const ratio = value / maxValue
  if (ratio > 0.66) return { fill: COLOR_HIGH, stroke: '#00006B', opacity: 0.75 }
  if (ratio > 0.33) return { fill: COLOR_MEDIUM, stroke: '#4040CC', opacity: 0.65 }
  return { fill: COLOR_LOW, stroke: '#8080BB', opacity: 0.5 }
}

function TooltipLine({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <>
      <br />
      <span className={classNames('fr-text--xs', muted && 'fr-text-mention--grey')}>{children}</span>
    </>
  )
}

function ResetViewButton() {
  const map = useMap()
  return (
    <div className={classNames('leaflet-bottom', 'leaflet-right', styles.resetButtonWrapper)}>
      <div className="leaflet-control leaflet-bar">
        <button className={styles.resetButton} title="Centrer sur la France" onClick={() => map.fitBounds(FRANCE_BBOX)}>
          ⌂
        </button>
      </div>
    </div>
  )
}

function FitBoundsController({ features, isFiltered }: { features: GeoJSON.Feature[]; isFiltered: boolean }) {
  const map = useMap()

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
      map.fitBounds(FRANCE_BBOX)
    }, 50)
    return () => clearTimeout(timer)
  }, [map])

  useEffect(() => {
    if (!isFiltered || features.length === 0) return
    const bbox = getBboxFromFeatures(features)
    if (bbox) map.fitBounds(bbox, { padding: [30, 30], maxZoom: 10 })
  }, [map, features, isFiltered])

  return null
}

interface FeatureLayerProps {
  feature: GeoJSON.Feature
  covered: boolean
  coverageItem: EpciCoverageItem | undefined
  colorMode: MapColorMode
  maxValue: number
}

function FeatureLayer({ feature, covered, coverageItem, colorMode, maxValue }: FeatureLayerProps) {
  const geoJsonRef = useRef<L.GeoJSON>(null)
  const props = feature.properties as Record<string, unknown>
  const nom = (props['SCoT'] ?? props.nom ?? props.name ?? props.code ?? '') as string

  const colorValue = useMemo(() => {
    if (!covered || !coverageItem) return 0
    if (colorMode === 'score' || colorMode === 'exports') return coverageItem.nbScenarios
    return 1
  }, [covered, coverageItem, colorMode])

  const { fill, stroke, opacity } = useMemo(() => {
    if (colorMode === 'scenarios') {
      return covered ? { fill: COLOR_HIGH, stroke: '#00006B', opacity: 0.6 } : { fill: COLOR_NONE, stroke: '#999999', opacity: 0.3 }
    }
    return getIntensityColor(colorValue, maxValue)
  }, [colorMode, covered, colorValue, maxValue])

  const styleObj = useMemo(
    () => ({
      color: stroke,
      fillColor: fill,
      fillOpacity: opacity,
      weight: covered ? 1.5 : 0.5,
    }),
    [stroke, fill, opacity, covered],
  )

  useEffect(() => {
    geoJsonRef.current?.setStyle(styleObj)
  }, [styleObj])

  return (
    <GeoJSON ref={geoJsonRef} data={feature} style={styleObj}>
      <Tooltip sticky>
        <strong>{nom}</strong>
        {covered && coverageItem ? (
          <>
            <TooltipLine>Flux : {coverageItem.totalFlux.toLocaleString('fr-FR')}</TooltipLine>
            <TooltipLine>Mal-logement : {coverageItem.totalStock.toLocaleString('fr-FR')}</TooltipLine>
            <TooltipLine>
              <strong>Total : {coverageItem.totalHousingNeeds.toLocaleString('fr-FR')} logements</strong>
            </TooltipLine>
            {colorMode !== 'scenarios' && <TooltipLine>Scénarios : {coverageItem.nbScenarios}</TooltipLine>}
          </>
        ) : (
          <TooltipLine muted>Aucun scénario réalisé</TooltipLine>
        )}
      </Tooltip>
    </GeoJSON>
  )
}

export interface PilotageDeploymentMapProps {
  userType?: string | null
  isAdmin?: boolean
  coverageData: EpciCoverageItem[]
  isFiltered: boolean
  colorMode?: MapColorMode
}

export function PilotageDeploymentMap({
  userType,
  isAdmin,
  coverageData,
  isFiltered,
  colorMode = 'scenarios',
}: PilotageDeploymentMapProps) {
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null)

  const { coverageMap, visibleCodes } = useMemo(() => {
    const map = new Map<string, EpciCoverageItem>()
    const codes = new Set<string>()
    for (const item of coverageData) {
      map.set(item.epciCode, item)
      codes.add(item.epciCode)
    }
    return { coverageMap: map, visibleCodes: codes }
  }, [coverageData])

  const maxValue = useMemo(() => {
    if (colorMode === 'scenarios') return 1
    return Math.max(...coverageData.map((d) => d.nbScenarios), 1)
  }, [coverageData, colorMode])

  const geoJsonUrl = getGeoJsonUrl(userType, isAdmin)
  useEffect(() => {
    const controller = new AbortController()
    setGeoJsonData(null)
    fetch(geoJsonUrl, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => setGeoJsonData(data))
    return () => controller.abort()
  }, [geoJsonUrl])

  const visibleFeatures = useMemo(() => {
    const features = geoJsonData?.features ?? []
    if (!isFiltered) return features
    return features.filter((f) => {
      const props = f.properties as Record<string, unknown>
      const code = (props.code ?? props.code_epci ?? '') as string
      return visibleCodes.has(code)
    })
  }, [geoJsonData, isFiltered, visibleCodes])

  return (
    <MapContainer center={FRANCE_CENTER} zoom={FRANCE_ZOOM} className="fr-height-full fr-width-full" zoomControl>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <ResetViewButton />
      <FitBoundsController features={visibleFeatures} isFiltered={isFiltered} />
      {visibleFeatures.map((feature, i) => {
        const props = feature.properties as Record<string, unknown>
        const code = (props.code ?? props.code_epci ?? props.epci_code ?? '') as string
        const epciCodes = Array.isArray(props.epcis) ? (props.epcis as string[]) : code ? [code] : []
        const covered = epciCodes.some((c) => coverageMap.get(c)?.hasScenario)
        const coverageItem = epciCodes.map((c) => coverageMap.get(c)).find((item) => item?.hasScenario)
        const featureKey = (feature.id != null ? String(feature.id) : null) ?? (code ? `${code}-${i}` : i)
        return (
          <FeatureLayer
            key={featureKey}
            feature={feature}
            covered={covered}
            coverageItem={coverageItem}
            colorMode={colorMode}
            maxValue={maxValue}
          />
        )
      })}
    </MapContainer>
  )
}
