import { ExecutionContext } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { Role } from '~/generated/prisma/enums'
import { EpciNeighborsAccessGuard } from './epci-neighbors-access.guard'

describe('EpciNeighborsAccessGuard', () => {
  const createGuard = async (allowedEmails = '') => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EpciNeighborsAccessGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'EPCI_NEIGHBORS_ALLOWED_EMAILS') return allowedEmails
              return undefined
            }),
          },
        },
      ],
    }).compile()
    return module.get<EpciNeighborsAccessGuard>(EpciNeighborsAccessGuard)
  }

  const createMockContext = (user: any, impersonator?: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, impersonator }),
      }),
    }) as any

  it('should be defined', async () => {
    const guard = await createGuard()
    expect(guard).toBeDefined()
  })

  describe('canActivate', () => {
    it('should allow admin users', async () => {
      const guard = await createGuard()
      const context = createMockContext({ email: 'admin@test.com', role: Role.ADMIN })
      expect(guard.canActivate(context)).toBe(true)
    })

    it('should allow users in the allowlist', async () => {
      const guard = await createGuard('allowed@test.com, another@test.com')
      const context = createMockContext({ email: 'allowed@test.com', role: Role.USER })
      expect(guard.canActivate(context)).toBe(true)
    })

    it('should deny users not in the allowlist', async () => {
      const guard = await createGuard('allowed@test.com')
      const context = createMockContext({ email: 'notallowed@test.com', role: Role.USER })
      expect(guard.canActivate(context)).toBe(false)
    })

    it('should handle case-insensitive email matching', async () => {
      const guard = await createGuard('Allowed@Test.COM')
      const context = createMockContext({ email: 'allowed@test.com', role: Role.USER })
      expect(guard.canActivate(context)).toBe(true)
    })

    it('should check impersonator role for admin bypass', async () => {
      const guard = await createGuard()
      const user = { email: 'user@test.com', role: Role.USER }
      const impersonator = { email: 'admin@test.com', role: Role.ADMIN }
      const context = createMockContext(user, impersonator)
      expect(guard.canActivate(context)).toBe(true)
    })

    it('should use user email for allowlist check even with impersonator', async () => {
      const guard = await createGuard('user@test.com')
      const user = { email: 'user@test.com', role: Role.USER }
      const impersonator = { email: 'other@test.com', role: Role.USER }
      const context = createMockContext(user, impersonator)
      expect(guard.canActivate(context)).toBe(true)
    })

    it('should handle empty allowlist', async () => {
      const guard = await createGuard('')
      const context = createMockContext({ email: 'user@test.com', role: Role.USER })
      expect(guard.canActivate(context)).toBe(false)
    })
  })
})
