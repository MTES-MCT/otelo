import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { SitadelService } from './sitadel.service'

describe('SitadelService', () => {
  let service: SitadelService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SitadelService, { provide: PrismaService, useValue: createMock<PrismaService>() }],
    }).compile()

    service = module.get<SitadelService>(SitadelService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
