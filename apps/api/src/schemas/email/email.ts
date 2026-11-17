import { z } from 'zod'

export const ZEmailDto = z.object({
  to: z.email(),
  subject: z.string(),
  html: z.string(),
  text: z.string().optional(),
  from: z.email().optional(),
  senderName: z.string().optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        content: z.string(),
      }),
    )
    .optional(),
})

export type TEmailDto = z.infer<typeof ZEmailDto>

export const ZContactDto = z.object({
  firstname: z.string().min(1).max(100),
  lastname: z.string().min(1).max(100),
  email: z.email().max(254),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
})

export type TContactDto = z.infer<typeof ZContactDto>
