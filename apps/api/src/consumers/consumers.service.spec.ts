import { createMock } from '@golevelup/ts-jest'
import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { ConsumersService } from './consumers.service'

describe('ConsumersService', () => {
  let service: ConsumersService
  let mockPrismaService: jest.Mocked<PrismaService>

  beforeEach(async () => {
    mockPrismaService = createMock<PrismaService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsumersService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile()

    service = module.get<ConsumersService>(ConsumersService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a consumer and return the raw key', async () => {
      mockPrismaService.apiConsumer.create = jest.fn().mockResolvedValue({
        id: 'consumer-1',
        name: 'Test Consumer',
        prefix: '12345678',
        active: true,
        createdAt: new Date(),
        hashedKey: 'hashed',
      })

      const result = await service.create({ name: 'Test Consumer' })

      expect(result.name).toBe('Test Consumer')
      expect(result.key).toMatch(/^otelo_[a-f0-9]{64}$/)
      expect(result.prefix).toBeDefined()
      expect(mockPrismaService.apiConsumer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Consumer',
          hashedKey: expect.any(String),
          encryptedKey: expect.any(String),
          prefix: expect.any(String),
        }),
      })
    })
  })

  describe('list', () => {
    it('should return all consumers without hashed keys', async () => {
      const consumers = [
        { id: '1', name: 'Consumer 1', prefix: 'aabb', active: true, createdAt: new Date(), lastUsedAt: null },
        { id: '2', name: 'Consumer 2', prefix: 'ccdd', active: false, createdAt: new Date(), lastUsedAt: new Date() },
      ]
      mockPrismaService.apiConsumer.findMany = jest.fn().mockResolvedValue(consumers)

      const result = await service.list()

      expect(result).toEqual(consumers)
      expect(mockPrismaService.apiConsumer.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({ id: true, name: true, prefix: true }),
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('get', () => {
    it('should return a consumer by id', async () => {
      const consumer = { id: '1', name: 'Consumer 1', prefix: 'aabb', active: true, createdAt: new Date(), lastUsedAt: null }
      mockPrismaService.apiConsumer.findUnique = jest.fn().mockResolvedValue(consumer)

      const result = await service.get('1')

      expect(result).toEqual(consumer)
    })

    it('should throw NotFoundException when consumer not found', async () => {
      mockPrismaService.apiConsumer.findUnique = jest.fn().mockResolvedValue(null)

      await expect(service.get('non-existent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getKey', () => {
    it('should return the decrypted key', async () => {
      // First create to get a valid encrypted key
      mockPrismaService.apiConsumer.create = jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: '1',
          name: 'Consumer',
          prefix: data.prefix,
          active: true,
          createdAt: new Date(),
          hashedKey: data.hashedKey,
          encryptedKey: data.encryptedKey,
        }),
      )

      const created = await service.create({ name: 'Consumer' })

      mockPrismaService.apiConsumer.findUnique = jest.fn().mockResolvedValue({
        encryptedKey: mockPrismaService.apiConsumer.create.mock.calls[0][0].data.encryptedKey,
      })

      const result = await service.getKey('1')

      expect(result.key).toBe(created.key)
    })

    it('should throw NotFoundException when consumer not found', async () => {
      mockPrismaService.apiConsumer.findUnique = jest.fn().mockResolvedValue(null)

      await expect(service.getKey('non-existent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update a consumer', async () => {
      const consumer = { id: '1', name: 'Updated', prefix: 'aabb', active: false, createdAt: new Date(), lastUsedAt: null }
      mockPrismaService.apiConsumer.findUnique = jest.fn().mockResolvedValue(consumer)
      mockPrismaService.apiConsumer.update = jest.fn().mockResolvedValue(consumer)

      const result = await service.update('1', { name: 'Updated', active: false })

      expect(result.name).toBe('Updated')
      expect(mockPrismaService.apiConsumer.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated', active: false },
        select: expect.any(Object),
      })
    })
  })

  describe('delete', () => {
    it('should delete a consumer', async () => {
      mockPrismaService.apiConsumer.findUnique = jest.fn().mockResolvedValue({ id: '1', name: 'Consumer' })
      mockPrismaService.apiConsumer.delete = jest.fn().mockResolvedValue({ id: '1' })

      await service.delete('1')

      expect(mockPrismaService.apiConsumer.delete).toHaveBeenCalledWith({ where: { id: '1' } })
    })

    it('should throw NotFoundException when deleting non-existent consumer', async () => {
      mockPrismaService.apiConsumer.findUnique = jest.fn().mockResolvedValue(null)

      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('regenerateKey', () => {
    it('should regenerate the key and return the new raw key', async () => {
      mockPrismaService.apiConsumer.findUnique = jest.fn().mockResolvedValue({ id: '1', name: 'Consumer' })
      mockPrismaService.apiConsumer.update = jest.fn().mockResolvedValue({
        id: '1',
        name: 'Consumer',
        prefix: 'newprefi',
        active: true,
        createdAt: new Date(),
      })

      const result = await service.regenerateKey('1')

      expect(result.key).toMatch(/^otelo_[a-f0-9]{64}$/)
      expect(mockPrismaService.apiConsumer.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          hashedKey: expect.any(String),
          encryptedKey: expect.any(String),
          prefix: expect.any(String),
        }),
        select: expect.any(Object),
      })
    })
  })
})
