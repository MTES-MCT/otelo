import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { EpcisService } from '~/epcis/epcis.service'
import { EpcisController } from './epcis.controller'

describe('EpcisController', () => {
  let controller: EpcisController
  const epcisService = createMock<EpcisService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EpcisController],
      providers: [
        {
          provide: EpcisService,
          useValue: epcisService,
        },
      ],
    }).compile()

    controller = module.get<EpcisController>(EpcisController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
