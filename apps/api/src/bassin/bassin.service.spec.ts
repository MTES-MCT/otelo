import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { BassinService } from './bassin.service'

describe('BassinService', () => {
  let service: BassinService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BassinService, { provide: PrismaService, useValue: createMock<PrismaService>() }],
    }).compile()

    service = module.get<BassinService>(BassinService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
