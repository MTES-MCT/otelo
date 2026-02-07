import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { RpInseeService } from './rp-insee.service'

describe('RpInseeService', () => {
  let service: RpInseeService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RpInseeService, { provide: PrismaService, useValue: createMock<PrismaService>() }],
    }).compile()

    service = module.get<RpInseeService>(RpInseeService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
