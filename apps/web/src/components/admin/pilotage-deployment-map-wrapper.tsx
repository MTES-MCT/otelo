'use client'

import dynamic from 'next/dynamic'
import type { MapColorMode, PilotageDeploymentMapProps } from './pilotage-deployment-map'

const PilotageDeploymentMap = dynamic(() => import('./pilotage-deployment-map').then((mod) => mod.PilotageDeploymentMap), {
  ssr: false,
  loading: () => <div className="fr-height-full fr-flex fr-align-items-center fr-justify-content-center">Chargement de la carte...</div>,
})

export { PilotageDeploymentMap as PilotageDeploymentMapWrapper }
export type { MapColorMode, PilotageDeploymentMapProps }
