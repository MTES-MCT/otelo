import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionService } from './demographic-evolution.service'

describe('DemographicEvolutionService', () => {
  let service: DemographicEvolutionService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DemographicEvolutionService, { provide: PrismaService, useValue: createMock<PrismaService>() }],
    }).compile()

    service = module.get<DemographicEvolutionService>(DemographicEvolutionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
