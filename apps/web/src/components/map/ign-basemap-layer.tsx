'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import type { Layer } from 'leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { IGN_ATTRIBUTION, IGN_STYLE_URL } from '~/utils/ign-basemap'

/**
 * Branche le Plan IGN (style vectoriel) sur la carte Leaflet englobante.
 *
 * maplibre-gl touche `window` dès son évaluation : il est donc importé dans l'effet, ce qui le tient
 * hors du bundle serveur et hors du chunk initial. Le rendu reste piloté par Leaflet — le calque
 * n'est qu'un canvas dans le `tilePane`, sous le `overlayPane` où se dessinent les couches GeoJSON.
 */
export function IgnBasemapLayer() {
  const map = useMap()

  useEffect(() => {
    let cancelled = false
    let layer: Layer | undefined

    void (async () => {
      const { default: L } = await import('leaflet')
      await import('@maplibre/maplibre-gl-leaflet')
      if (cancelled) return

      layer = L.maplibreGL({
        style: IGN_STYLE_URL,
        attributionControl: { customAttribution: IGN_ATTRIBUTION },

        // La Géoplateforme ne publie que le sprite 1x. Sur écran à haute densité maplibre réclame
        // le `@2x`, se prend un 404 et la carte perd tous ses pictogrammes. Chaque icône du sprite
        // déclare `pixelRatio: 1`, donc rabattre la requête sur le fichier nu les dimensionne juste.
        transformRequest: (url, resourceType) =>
          resourceType === 'SpriteJSON' || resourceType === 'SpriteImage' ? { url: url.replace('@2x', '') } : undefined,

        // Ce fond sert de toile de repérage sous des aplats : on ne paie ni l'antialiasing WebGL,
        // ni le fondu des étiquettes à chaque tuile, ni le rafraîchissement des tuiles expirées.
        canvasContextAttributes: { antialias: false },
        fadeDuration: 0,
        refreshExpiredTiles: false,
      })
      layer.addTo(map)
    })()

    return () => {
      cancelled = true
      if (layer) map.removeLayer(layer)
    }
  }, [map])

  return null
}
