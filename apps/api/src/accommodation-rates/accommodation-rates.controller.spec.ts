import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { AccommodationRatesController } from './accommodation-rates.controller'

describe('AccommodationRatesController', () => {
  let controller: AccommodationRatesController
  const mockAccommodationRatesService = createMock<AccommodationRatesService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccommodationRatesController],
      providers: [
        {
          provide: AccommodationRatesService,
          useValue: mockAccommodationRatesService,
        },
      ],
    }).compile()

    controller = module.get<AccommodationRatesController>(AccommodationRatesController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
