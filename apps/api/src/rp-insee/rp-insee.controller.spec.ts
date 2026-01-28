import { Test, TestingModule } from '@nestjs/testing'
import { RpInseeController } from './rp-insee.controller'

describe('RpInseeController', () => {
  let controller: RpInseeController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RpInseeController],
    }).compile()

    controller = module.get<RpInseeController>(RpInseeController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
