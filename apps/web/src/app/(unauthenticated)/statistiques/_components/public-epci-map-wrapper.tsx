'use client'

import dynamic from 'next/dynamic'
import type { PublicEpciMapProps } from './public-epci-map'

const PublicEpciMap = dynamic(() => import('./public-epci-map').then((mod) => mod.PublicEpciMap), {
  ssr: false,
  loading: () => (
    <div className="fr-flex fr-align-items-center fr-justify-content-center" style={{ height: '560px' }}>
      Chargement de la carte…
    </div>
  ),
})

export function PublicEpciMapWrapper(props: PublicEpciMapProps) {
  return <PublicEpciMap {...props} />
}
