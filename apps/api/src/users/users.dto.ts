import { createZodDto } from 'nestjs-zod'
import { ZUpdateUserType } from '~/schemas/users/update-user'

export class UpdateUserTypeDto extends createZodDto(ZUpdateUserType) {}
