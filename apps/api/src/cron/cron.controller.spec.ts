import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { CronService } from '~/cron/cron.service'
import { CronController } from './cron.controller'

describe('CronController', () => {
  let controller: CronController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CronController],
      providers: [{ provide: CronService, useValue: createMock<CronService>() }],
    }).compile()

    controller = module.get<CronController>(CronController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
