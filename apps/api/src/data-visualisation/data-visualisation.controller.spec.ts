import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { DataVisualisationService } from '~/data-visualisation/data-visualisation.service'
import { DataVisualisationController } from './data-visualisation.controller'

describe('DataVisualisationController', () => {
  let controller: DataVisualisationController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataVisualisationController],
      providers: [{ provide: DataVisualisationService, useValue: createMock<DataVisualisationService>() }],
    }).compile()

    controller = module.get<DataVisualisationController>(DataVisualisationController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
