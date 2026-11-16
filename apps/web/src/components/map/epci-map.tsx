'use client'

import 'leaflet/dist/leaflet.css'
import classNames from 'classnames'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { GeoJSON, MapContainer, Tooltip, useMap } from 'react-leaflet'
import { IgnBasemapLayer } from '~/components/map/ign-basemap-layer'
import styles from './epci-map.module.css'

type Bounds = [[number, number], [number, number]]
type EpciStyle = { fill: string; stroke: string; opacity: number }

export const FRANCE_CENTER: [number, number] = [46.5, 2.3]
export const FRANCE_ZOOM = 5
export const FRANCE_BBOX: Bounds = [
  [41.2, -5.2],
  [51.1, 9.6],
]

const COLOR_NONE = '#CCCCCC'
const STROKE_NONE = '#999999'

export type EpciMapProps = {
  geoJsonUrl: string
  /** null = territoire non coloré (gris) */
  styleFor: (code: string, feature: GeoJSON.Feature) => EpciStyle | null
  tooltipFor: (code: string, name: string, feature: GeoJSON.Feature) => ReactNode | null
  /** Recadrage explicite sur ces entités */
  fitTo?: GeoJSON.Feature[]
  /** Recadre sur les entités retenues par `featureFilter` */
  fitToFiltered?: boolean
  /** Ne dessine que les entités pour lesquelles le filtre renvoie true (à mémoïser) */
  featureFilter?: (feature: GeoJSON.Feature) => boolean
  shortcuts?: { label: string; bounds: Bounds }[]
  height?: string
}

export function getFeatureCode(feature: GeoJSON.Feature): string {
  const props = (feature.properties ?? {}) as Record<string, unknown>
  return (props.code ?? props.code_epci ?? props.epci_code ?? '') as string
}

function getFeatureName(feature: GeoJSON.Feature): string {
  const props = (feature.properties ?? {}) as Record<string, unknown>
  return (props['SCoT'] ?? props.nom ?? props.name ?? props.code ?? '') as string
}

function getBboxFromFeatures(features: GeoJSON.Feature[]): Bounds | null {
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

function ResetViewButton() {
  const map = useMap()
  return (
    <div className={classNames('leaflet-bottom', 'leaflet-right', styles.resetButtonWrapper)}>
      <div className="leaflet-control leaflet-bar">
        <button className={styles.resetButton} title="Recentrer sur la France" onClick={() => map.fitBounds(FRANCE_BBOX)}>
          ⌂
        </button>
      </div>
    </div>
  )
}

function ShortcutButtons({ shortcuts }: { shortcuts: NonNullable<EpciMapProps['shortcuts']> }) {
  const map = useMap()
  return (
    <div className={classNames('leaflet-bottom', 'leaflet-left', styles.shortcutsWrapper)}>
      <div className={classNames('leaflet-control', 'leaflet-bar', styles.shortcuts)}>
        {shortcuts.map((s) => (
          <button key={s.label} type="button" className={styles.shortcutButton} onClick={() => map.fitBounds(s.bounds)}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function FitBoundsController({ features }: { features?: GeoJSON.Feature[] }) {
  const map = useMap()

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
      map.fitBounds(FRANCE_BBOX)
    }, 50)
    return () => clearTimeout(timer)
  }, [map])

  useEffect(() => {
    if (!features || features.length === 0) return
    const bbox = getBboxFromFeatures(features)
    if (bbox) map.fitBounds(bbox, { padding: [30, 30], maxZoom: 10 })
  }, [map, features])

  return null
}

type FeatureLayerProps = {
  feature: GeoJSON.Feature
  style: EpciStyle | null
  tooltip: ReactNode | null
}

function FeatureLayer({ feature, style, tooltip }: FeatureLayerProps) {
  const geoJsonRef = useRef<L.GeoJSON>(null)
  const fill = style?.fill ?? COLOR_NONE
  const stroke = style?.stroke ?? STROKE_NONE
  const opacity = style?.opacity ?? 0.3
  const colored = style !== null

  const styleObj = useMemo(
    () => ({
      color: stroke,
      fillColor: fill,
      fillOpacity: opacity,
      weight: colored ? 1.5 : 0.5,
    }),
    [stroke, fill, opacity, colored],
  )

  useEffect(() => {
    geoJsonRef.current?.setStyle(styleObj)
  }, [styleObj])

  return (
    <GeoJSON ref={geoJsonRef} data={feature} style={styleObj}>
      {tooltip != null && <Tooltip sticky>{tooltip}</Tooltip>}
    </GeoJSON>
  )
}

export function EpciMap({ geoJsonUrl, styleFor, tooltipFor, fitTo, fitToFiltered, featureFilter, shortcuts, height }: EpciMapProps) {
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null)

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
    return featureFilter ? features.filter(featureFilter) : features
  }, [geoJsonData, featureFilter])

  const fitFeatures = fitTo ?? (fitToFiltered ? visibleFeatures : undefined)

  return (
    <MapContainer
      center={FRANCE_CENTER}
      zoom={FRANCE_ZOOM}
      className={height ? 'fr-width-full' : 'fr-height-full fr-width-full'}
      style={height ? { height } : undefined}
      zoomControl
    >
      <IgnBasemapLayer />
      <ResetViewButton />
      {shortcuts && shortcuts.length > 0 && <ShortcutButtons shortcuts={shortcuts} />}
      <FitBoundsController features={fitFeatures} />
      {visibleFeatures.map((feature, i) => {
        const code = getFeatureCode(feature)
        const featureKey = (feature.id != null ? String(feature.id) : null) ?? (code ? `${code}-${i}` : i)
        return (
          <FeatureLayer
            key={featureKey}
            feature={feature}
            style={styleFor(code, feature)}
            tooltip={tooltipFor(code, getFeatureName(feature), feature)}
          />
        )
      })}
    </MapContainer>
  )
}
