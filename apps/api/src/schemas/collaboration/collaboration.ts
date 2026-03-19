import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const ZInviteCollaboratorBody = z.object({ email: z.string().email() })
export class InviteCollaboratorDto extends createZodDto(ZInviteCollaboratorBody) {}
