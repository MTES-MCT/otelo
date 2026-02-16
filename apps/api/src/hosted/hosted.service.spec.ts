import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { HostedService } from './hosted.service'

describe('HostedService', () => {
  let service: HostedService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HostedService, { provide: PrismaService, useValue: createMock<PrismaService>() }],
    }).compile()

    service = module.get<HostedService>(HostedService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
