'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import 'leaflet/dist/leaflet.css'

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import('react-leaflet').then((mod) => mod.GeoJSON), { ssr: false })

interface GeoJSONPolygon {
  type: 'Polygon'
  coordinates: [number, number][][]
}

interface GeoJSONMultiPolygon {
  type: 'MultiPolygon'
  coordinates: [number, number][][][]
}

export interface EpciData {
  code: string
  nom: string
  contour: GeoJSONPolygon | GeoJSONMultiPolygon
}

export interface ColoredEpciData extends EpciData {
  color: string
}

interface EpciMapProps {
  epciData?: EpciData | null
  epciDataList?: ColoredEpciData[]
  fillColor?: string
  strokeColor?: string
  fillOpacity?: number
  height?: string
}

interface Bounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

function getContourBounds(contour: GeoJSONPolygon | GeoJSONMultiPolygon): Bounds {
  const coords = contour.type === 'Polygon' ? contour.coordinates[0] : contour.coordinates[0][0]

  const lngs = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  }
}

function getCombinedBounds(epciDataList: ColoredEpciData[]): Bounds {
  const allBounds = epciDataList.map((epci) => getContourBounds(epci.contour))

  return {
    minLat: Math.min(...allBounds.map((b) => b.minLat)),
    maxLat: Math.max(...allBounds.map((b) => b.maxLat)),
    minLng: Math.min(...allBounds.map((b) => b.minLng)),
    maxLng: Math.max(...allBounds.map((b) => b.maxLng)),
  }
}

function getBoundsCenter(bounds: Bounds): [number, number] {
  return [(bounds.minLat + bounds.maxLat) / 2, (bounds.minLng + bounds.maxLng) / 2]
}

function getContourCenter(contour: GeoJSONPolygon | GeoJSONMultiPolygon): [number, number] {
  const bounds = getContourBounds(contour)
  return getBoundsCenter(bounds)
}

export const SimulationNeedsSummaryMap = ({
  epciData,
  epciDataList,
  fillColor = '#E3E3FD',
  strokeColor = '#8B8BF6',
  fillOpacity = 0.4,
  height = '400px',
}: EpciMapProps) => {
  const isMultiMode = epciDataList && epciDataList.length > 0

  const center = useMemo(() => {
    if (isMultiMode) {
      const bounds = getCombinedBounds(epciDataList)
      return getBoundsCenter(bounds)
    }
    if (epciData) {
      return getContourCenter(epciData.contour)
    }
    return [46.2276, 2.2137] as [number, number]
  }, [epciData, epciDataList, isMultiMode])

  const zoom = useMemo(() => {
    if (isMultiMode) {
      const bounds = getCombinedBounds(epciDataList)
      const latDiff = bounds.maxLat - bounds.minLat
      const lngDiff = bounds.maxLng - bounds.minLng
      const maxDiff = Math.max(latDiff, lngDiff)

      if (maxDiff > 5) return 7
      if (maxDiff > 2) return 8
      if (maxDiff > 1) return 9
      return 10
    }
    return 10
  }, [epciDataList, isMultiMode])

  const geoJsonFeatures = useMemo(() => {
    if (isMultiMode) {
      return epciDataList.map((epci) => ({
        type: 'Feature' as const,
        properties: {
          code: epci.code,
          nom: epci.nom,
          color: epci.color as string | undefined,
        },
        geometry: epci.contour,
      }))
    }
    if (epciData) {
      return [
        {
          type: 'Feature' as const,
          properties: {
            code: epciData.code,
            nom: epciData.nom,
            color: undefined as string | undefined,
          },
          geometry: epciData.contour,
        },
      ]
    }
    return []
  }, [epciData, epciDataList, isMultiMode])

  if (geoJsonFeatures.length === 0) return null

  const mapKey = useMemo(() => {
    if (isMultiMode) {
      return epciDataList.map((e) => e.code).join('-')
    }
    return epciData?.code || 'empty'
  }, [epciData, epciDataList, isMultiMode])

  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
      dragging={false}
      touchZoom={false}
      doubleClickZoom={false}
      scrollWheelZoom={false}
      boxZoom={false}
      keyboard={false}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {geoJsonFeatures.map((feature, index) => {
        const style =
          isMultiMode && feature.properties.color
            ? {
                color: feature.properties.color,
                fillColor: feature.properties.color,
                fillOpacity: fillOpacity,
                weight: 2,
              }
            : {
                color: strokeColor,
                fillColor: fillColor,
                fillOpacity: fillOpacity,
                weight: 2,
              }

        return <GeoJSON key={`${feature.properties.code}-${index}`} data={feature} style={style} />
      })}
    </MapContainer>
  )
}
