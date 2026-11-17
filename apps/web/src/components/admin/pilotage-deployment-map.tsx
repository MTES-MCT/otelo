'use client'

import classNames from 'classnames'
import { type ReactNode, useMemo } from 'react'
import { EpciMap, getFeatureCode } from '~/components/map/epci-map'
import type { EpciCoverageItem } from '~/hooks/use-pilotage-epcis-coverage'

export type MapColorMode = 'scenarios' | 'score' | 'exports'

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

function getEpciCodes(feature: GeoJSON.Feature): string[] {
  const props = feature.properties as Record<string, unknown>
  const code = getFeatureCode(feature)
  return Array.isArray(props.epcis) ? (props.epcis as string[]) : code ? [code] : []
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

  const featureFilter = useMemo(() => {
    if (!isFiltered) return undefined
    return (f: GeoJSON.Feature) => {
      const props = f.properties as Record<string, unknown>
      const code = (props.code ?? props.code_epci ?? '') as string
      return visibleCodes.has(code)
    }
  }, [isFiltered, visibleCodes])

  const findCovered = (feature: GeoJSON.Feature): EpciCoverageItem | undefined =>
    getEpciCodes(feature)
      .map((c) => coverageMap.get(c))
      .find((item) => item?.hasScenario)

  const styleFor = (_code: string, feature: GeoJSON.Feature) => {
    const coverageItem = findCovered(feature)
    if (!coverageItem) return null
    if (colorMode === 'scenarios') return { fill: COLOR_HIGH, stroke: '#00006B', opacity: 0.6 }
    return getIntensityColor(coverageItem.nbScenarios, maxValue)
  }

  const tooltipFor = (_code: string, nom: string, feature: GeoJSON.Feature) => {
    const coverageItem = findCovered(feature)
    return (
      <>
        <strong>{nom}</strong>
        {coverageItem ? (
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
      </>
    )
  }

  return (
    <EpciMap
      geoJsonUrl={getGeoJsonUrl(userType, isAdmin)}
      styleFor={styleFor}
      tooltipFor={tooltipFor}
      featureFilter={featureFilter}
      fitToFiltered={isFiltered}
    />
  )
}
