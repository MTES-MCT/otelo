import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { PhysicalInadequationService } from './physical-inadequation.service'

describe('PhysicalInadequationService', () => {
  let service: PhysicalInadequationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PhysicalInadequationService, { provide: PrismaService, useValue: createMock<PrismaService>() }],
    }).compile()

    service = module.get<PhysicalInadequationService>(PhysicalInadequationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
