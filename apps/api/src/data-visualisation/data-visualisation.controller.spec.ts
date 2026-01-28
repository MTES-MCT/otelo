import { Test, TestingModule } from '@nestjs/testing'
import { DataVisualisationController } from './data-visualisation.controller'

describe('DataVisualisationController', () => {
  let controller: DataVisualisationController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataVisualisationController],
    }).compile()

    controller = module.get<DataVisualisationController>(DataVisualisationController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
