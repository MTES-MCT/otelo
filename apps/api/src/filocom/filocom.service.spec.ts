import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { FilocomService } from './filocom.service'

describe('FilocomService', () => {
  let service: FilocomService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilocomService, { provide: PrismaService, useValue: createMock<PrismaService>() }],
    }).compile()

    service = module.get<FilocomService>(FilocomService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
