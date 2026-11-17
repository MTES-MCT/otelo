'use client'

import dynamic from 'next/dynamic'

const TerritoiresVoisinsMap = dynamic(() => import('./territoires-voisins-map').then((mod) => mod.TerritoiresVoisinsMap), {
  ssr: false,
  loading: () => (
    <div style={{ height: '620px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement de la carte...</div>
  ),
})

export type { TerritoiresVoisinsMapProps } from './territoires-voisins-map'
export { TerritoiresVoisinsMap as TerritoiresVoisinsMapWrapper }
