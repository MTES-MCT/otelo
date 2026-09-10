import { createZodDto } from 'nestjs-zod'
import { ZSubmitFeedback } from '~/schemas/feedback/submit-feedback'

export class SubmitFeedbackDto extends createZodDto(ZSubmitFeedback) {}
