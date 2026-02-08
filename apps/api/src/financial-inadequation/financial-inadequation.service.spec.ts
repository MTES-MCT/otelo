import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { FinancialInadequationService } from './financial-inadequation.service'

describe('FinancialInadequationService', () => {
  let service: FinancialInadequationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinancialInadequationService, { provide: PrismaService, useValue: createMock<PrismaService>() }],
    }).compile()

    service = module.get<FinancialInadequationService>(FinancialInadequationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
