import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { ChartGenerationService } from '~/export-powerpoint/chart-generation/chart-generation.service'
import { ZipService } from '~/export-powerpoint/zip/zip.service'
import { PlaceholderGenerationService } from './placeholder-generation.service'

describe('PlaceholderGenerationService', () => {
  let service: PlaceholderGenerationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaceholderGenerationService,
        { provide: ChartGenerationService, useValue: createMock<ChartGenerationService>() },
        { provide: ZipService, useValue: createMock<ZipService>() },
      ],
    }).compile()

    service = module.get<PlaceholderGenerationService>(PlaceholderGenerationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
