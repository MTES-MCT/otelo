import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { VacancyService } from './vacancy.service'

describe('VacancyService', () => {
  let service: VacancyService
  const mockPrismaService = createMock<PrismaService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VacancyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<VacancyService>(VacancyService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
