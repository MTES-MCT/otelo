import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { HouseholdSizesService } from './household-sizes.service'

describe('HouseholdSizesService', () => {
  let service: HouseholdSizesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HouseholdSizesService, { provide: PrismaService, useValue: createMock<PrismaService>() }],
    }).compile()

    service = module.get<HouseholdSizesService>(HouseholdSizesService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
