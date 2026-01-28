import { z } from 'zod'

const ZLiteralSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
type TLiteral = z.infer<typeof ZLiteralSchema>

type TJson = TLiteral | { [key: string]: TJson } | TJson[]

export const ZJsonSchema: z.ZodType<TJson> = z.lazy(() =>
  z.union([ZLiteralSchema, z.array(ZJsonSchema), z.record(z.string(), ZJsonSchema)]),
)
