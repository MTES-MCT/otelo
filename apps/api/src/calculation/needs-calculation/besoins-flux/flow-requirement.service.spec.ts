import { Test, TestingModule } from '@nestjs/testing'
import { FlowRequirementService } from './flow-requirement.service'

describe('FlowRequirementService', () => {
  let service: FlowRequirementService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlowRequirementService],
    }).compile()

    service = module.get<FlowRequirementService>(FlowRequirementService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
