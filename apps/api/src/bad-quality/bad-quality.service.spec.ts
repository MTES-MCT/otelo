import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { BadQualityService } from './bad-quality.service'

describe('BadQualityService', () => {
  let service: BadQualityService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BadQualityService, { provide: PrismaService, useValue: createMock<PrismaService>() }],
    }).compile()

    service = module.get<BadQualityService>(BadQualityService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
