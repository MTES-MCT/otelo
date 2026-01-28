import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { Epci } from '~/generated/prisma/client'
import { EpcisService } from './epcis.service'

describe('EpcisService', () => {
  let service: EpcisService
  const mockPrismaService = createMock<PrismaService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EpcisService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<EpcisService>(EpcisService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('get', () => {
    it('should return an epci', async () => {
      const mockEpci = {
        code: '1234567890',
      } as Epci

      mockPrismaService.epci.findUniqueOrThrow = jest.fn().mockResolvedValue(mockEpci)

      const result = await service.get('1234567890')
      expect(result).toEqual(mockEpci)
    })

    it('should throw an error if the epci is not found', async () => {
      mockPrismaService.epci.findUniqueOrThrow = jest.fn().mockRejectedValue(new Error('Epci not found'))

      await expect(service.get('1234567890')).rejects.toThrow('Epci not found')
    })
  })

  describe('post', () => {
    it('should create an epci', async () => {
      const mockEpci = {
        code: '1234567890',
      } as Epci

      mockPrismaService.epci.create = jest.fn().mockResolvedValue(mockEpci)

      const result = await service.create(mockEpci)
      expect(mockPrismaService.epci.create).toHaveBeenCalledWith({
        data: mockEpci,
      })
      expect(result).toEqual(mockEpci)
    })
  })

  describe('put', () => {
    it('should update an epci', async () => {
      const mockEpci = {
        code: '1234567890',
      } as Epci

      mockPrismaService.epci.update = jest.fn().mockResolvedValue(mockEpci)

      const result = await service.put('1234567890', mockEpci)
      expect(mockPrismaService.epci.update).toHaveBeenCalledWith({
        data: mockEpci,
        where: { code: '1234567890' },
      })
      expect(result).toEqual(mockEpci)
    })
  })

  describe('delete', () => {
    it('should delete an epci', async () => {
      await service.delete('1234567890')
      expect(mockPrismaService.epci.delete).toHaveBeenCalledWith({
        where: { code: '1234567890' },
      })
    })
  })
})
