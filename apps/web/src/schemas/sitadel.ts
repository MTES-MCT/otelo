import z from 'zod'

const ZSitadelDataItem = z.object({
  year: z.number(),
  authorizedHousingCount: z.number(),
  startedHousingCount: z.number(),
  epciCode: z.string(),
})

export const ZSitadel = z.record(
  z.string(),
  z.object({
    name: z.string(),
    data: z.array(ZSitadelDataItem),
  }),
)

export type TSitadel = z.infer<typeof ZSitadel>
