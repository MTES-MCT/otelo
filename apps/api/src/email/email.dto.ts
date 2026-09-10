import { createZodDto } from 'nestjs-zod'
import { ZContactDto } from '~/schemas/email/email'

export class ContactDto extends createZodDto(ZContactDto) {}
