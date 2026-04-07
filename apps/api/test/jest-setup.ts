jest.mock('~/auth/better-auth', () => ({
  auth: {
    api: {
      requestPasswordReset: jest.fn().mockResolvedValue({}),
    },
  },
  sendBrevoTemplatedEmail: jest.fn().mockResolvedValue(undefined),
  checkWhitelistBeforeCreate: jest.fn(),
  updateLastLoginAt: jest.fn(),
}))
