import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Role } from '~/generated/prisma/enums'
import { TSubmitFeedback } from '~/schemas/feedback/submit-feedback'
import { TUser } from '~/schemas/users/user'
import { FeedbackService } from './feedback.service'

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @HttpCode(HttpStatus.OK)
  @Get('status')
  async getStatus(@User() user: TUser) {
    return this.feedbackService.getStatus(user.id)
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @HttpCode(HttpStatus.OK)
  @Post('submit')
  async submit(@User() user: TUser, @Body() body: TSubmitFeedback) {
    return this.feedbackService.submit(user.id, body)
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @HttpCode(HttpStatus.OK)
  @Post('snooze')
  async snooze(@User() user: TUser) {
    return this.feedbackService.snooze(user.id)
  }
}
