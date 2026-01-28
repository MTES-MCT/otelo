import { z } from 'zod'

export const ZDepartementDetailsSchema = z.object({
  code: z.string(),
  codeRegion: z.string(),
  nom: z.string(),
})

export type TDepartementDetailsSchema = z.infer<typeof ZDepartementDetailsSchema>

export const getDepartementDetails = async (name: string) => {
  return []
  const response = await fetch(`https://geo.api.gouv.fr/departements?nom=${name}&fields=nom,code,codeRegion`)
  if (!response.ok) {
    throw new Error('Failed to fetch departements data')
  }
  const data: TDepartementDetailsSchema[] = await response.json()
  return data
}
