import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { ExcludeOpenApi } from '~/common/decorators/exclude-open-api.decorator'
import { Role } from '~/generated/prisma/enums'
import { TUser } from '~/schemas/users/user'
import { SubmitFeedbackDto } from './feedback.dto'
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
  async submit(@User() user: TUser, @Body() body: SubmitFeedbackDto) {
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

  @ExcludeOpenApi()
  @AccessControl({
    roles: [Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  @Get('admin/list')
  async findAllSubmitted(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.feedbackService.findAllSubmitted(startDate, endDate)
  }
}
