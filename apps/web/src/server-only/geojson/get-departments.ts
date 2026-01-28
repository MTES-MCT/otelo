import { z } from 'zod'

export const ZFeatureGeoJSONSchema = z.object({
  geometry: z.object({
    coordinates: z.array(z.array(z.array(z.number()))),
    type: z.string(),
  }),
  properties: z.object({
    code_zo: z.string(),
    epcis: z.array(
      z.object({
        code_epci: z.string(),
        nom_epci: z.string(),
      }),
    ),
    lib_zo: z.string(),
    nom: z.string(),
  }),
  type: z.string(),
})

export type TFeatureGeoJSONSchema = z.infer<typeof ZFeatureGeoJSONSchema>

export const ZDepartementGeoJSONSchema = z.object({
  features: z.array(ZFeatureGeoJSONSchema),
  type: z.string(),
})

export type TDepartementGeoJSON = z.infer<typeof ZDepartementGeoJSONSchema>

export const getDepartments = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/geojson/departements')
    if (!response.ok) {
      throw new Error('Failed to fetch departements data')
    }
    const data: TDepartementGeoJSON = await response.json()

    return data
  } catch (error) {
    console.error('Error fetching departements:', error)
  }
}
