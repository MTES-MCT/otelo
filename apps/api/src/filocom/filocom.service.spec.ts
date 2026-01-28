import { Test, TestingModule } from '@nestjs/testing'
import { FilocomService } from './filocom.service'

describe('FilocomService', () => {
  let service: FilocomService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilocomService],
    }).compile()

    service = module.get<FilocomService>(FilocomService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
