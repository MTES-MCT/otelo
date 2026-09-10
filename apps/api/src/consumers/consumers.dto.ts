import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const ZCreateConsumer = z.object({
  name: z.string().min(1).max(100),
})

export const ZUpdateConsumer = z.object({
  name: z.string().min(1).max(100).optional(),
  active: z.boolean().optional(),
})

export class CreateConsumerDto extends createZodDto(ZCreateConsumer) {}
export class UpdateConsumerDto extends createZodDto(ZUpdateConsumer) {}
