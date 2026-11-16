'use client'

import type { TPublicStatistics } from '@otelo/shared'
import { useMemo } from 'react'
import { EpciMap, type EpciMapProps } from '~/components/map/epci-map'
import { EPCI_STATUS_COLORS, EPCI_STATUS_LABELS } from './format'

export type PublicEpciMapProps = {
  epcis: TPublicStatistics['epcis']
}

const GEOJSON_URL = '/geojson/epci-1000m.geojson'

const OVERSEAS_SHORTCUTS: NonNullable<EpciMapProps['shortcuts']> = [
  {
    label: 'Guadeloupe',
    bounds: [
      [15.8, -61.85],
      [16.55, -61.0],
    ],
  },
  {
    label: 'Martinique',
    bounds: [
      [14.38, -61.25],
      [14.9, -60.8],
    ],
  },
  {
    label: 'Guyane',
    bounds: [
      [2.1, -54.6],
      [5.8, -51.6],
    ],
  },
  {
    label: 'La Réunion',
    bounds: [
      [-21.4, 55.2],
      [-20.85, 55.85],
    ],
  },
  {
    label: 'Mayotte',
    bounds: [
      [-13.05, 45.0],
      [-12.6, 45.3],
    ],
  },
]

export function PublicEpciMap({ epcis }: PublicEpciMapProps) {
  const epciByCode = useMemo(() => new Map(epcis.map((epci) => [epci.code, epci])), [epcis])

  const styleFor = (code: string) => {
    const epci = epciByCode.get(code)
    return epci ? EPCI_STATUS_COLORS[epci.status] : null
  }

  const tooltipFor = (code: string, name: string) => {
    const epci = epciByCode.get(code)
    return (
      <>
        <strong>{epci?.name ?? name}</strong>
        {epci?.department && (
          <>
            <br />
            <span className="fr-text--xs">{epci.department}</span>
          </>
        )}
        <br />
        <span className="fr-text--xs">{epci ? EPCI_STATUS_LABELS[epci.status] : "N'utilise pas encore Otelo"}</span>
      </>
    )
  }

  return <EpciMap geoJsonUrl={GEOJSON_URL} styleFor={styleFor} tooltipFor={tooltipFor} shortcuts={OVERSEAS_SHORTCUTS} height="560px" />
}
