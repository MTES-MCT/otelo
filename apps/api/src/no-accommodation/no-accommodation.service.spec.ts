import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { NoAccommodationService } from './no-accommodation.service'

describe('NoAccommodationService', () => {
  let service: NoAccommodationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NoAccommodationService, { provide: PrismaService, useValue: createMock<PrismaService>() }],
    }).compile()

    service = module.get<NoAccommodationService>(NoAccommodationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
