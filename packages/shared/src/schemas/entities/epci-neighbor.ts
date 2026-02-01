import { z } from 'zod'

export const NeighborCategory = z.enum(['gen', 'logvac', 'mlgmt', 'projdem', 'ressec'])

export const ZGeoJsonPoint = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
})

export const ZGeoJsonContour = z.object({
  type: z.enum(['Polygon', 'MultiPolygon']),
  coordinates: z.array(z.any()),
})

export const ZEpciGeoData = z.object({
  code: z.string(),
  nom: z.string(),
  centre: ZGeoJsonPoint,
  contour: ZGeoJsonContour,
})

export const ZEpciNeighborWithGeo = z.object({
  epciCode: z.string(),
  neighborEpciCode: z.string(),
  category: NeighborCategory,
  rank: z.number().int(),
  score: z.number(),
  neighborEpci: z.object({
    code: z.string(),
    name: z.string(),
  }),
  geo: ZEpciGeoData.nullable(),
})

export const ZEpciNeighborsResponse = z.object({
  epci: ZEpciGeoData,
  neighbors: z.array(ZEpciNeighborWithGeo),
})

export type TEpciGeoData = z.infer<typeof ZEpciGeoData>
export type TEpciNeighborWithGeo = z.infer<typeof ZEpciNeighborWithGeo>
export type TEpciNeighborsResponse = z.infer<typeof ZEpciNeighborsResponse>
export type TNeighborCategory = z.infer<typeof NeighborCategory>
