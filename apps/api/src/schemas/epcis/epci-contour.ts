import { z } from 'zod'

/** GeoJSON tel que servi par l'API Géo, stocké tel quel dans `epci_contours`. */
const ZContour = z.object({
  coordinates: z.unknown(),
  type: z.enum(['Polygon', 'MultiPolygon']),
})

export const ZEpciContour = z.object({
  code: z.string(),
  contour: ZContour,
  nom: z.string(),
})

export type TEpciContour = z.infer<typeof ZEpciContour>
