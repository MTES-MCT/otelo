import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { of } from 'rxjs'
import { TEmailDto } from '~/schemas/email/email'
import { EmailService } from './email.service'

// Mock HttpService
const mockHttpService = {
  post: jest.fn(() => of({ data: {} })),
}

describe('EmailService', () => {
  let service: EmailService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key) => {
              if (key === 'BREVO_API_KEY') return 'test-api-key'
              if (key === 'BREVO_API_URL') return 'https://api.brevo.com/v3/smtp/email'
              if (key === 'EMAIL_SENDER_NAME') return 'OTELO'
              if (key === 'EMAIL_SENDER_EMAIL') return 'noreply@otelo.beta.gouv.fr'
              return null
            }),
          },
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile()

    service = module.get<EmailService>(EmailService)

    // Reset mocks before each test
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      // Arrange
      const emailDto: TEmailDto = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML Content</p>',
      }

      // Act
      await service.sendEmail(emailDto)

      // Assert
      expect(mockHttpService.post).toHaveBeenCalledTimes(1)
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/smtp/email',
        {
          subject: 'Test Subject',
          htmlContent: '<p>Test HTML Content</p>',
          textContent: undefined,
          sender: {
            name: 'OTELO',
            email: 'noreply@otelo.beta.gouv.fr',
          },
          to: [{ email: 'test@example.com' }],
        },
        {
          headers: {
            accept: 'application/json',
            'api-key': 'test-api-key',
            'content-type': 'application/json',
          },
        },
      )
    })

    it('should throw an error when sending fails', async () => {
      // Arrange
      const emailDto: TEmailDto = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML Content</p>',
      }

      mockHttpService.post.mockImplementationOnce(() => {
        throw new Error('API Error')
      })

      // Act & Assert
      await expect(service.sendEmail(emailDto)).rejects.toThrow('Failed to send email')
    })
  })

  describe('sendTemplatedEmail', () => {
    it('should send a templated email successfully', async () => {
      // Arrange
      const template = '1'
      const data = { name: 'Test User' }
      const to = 'test@example.com'
      const subject = 'Test Subject'

      // Act
      await service.sendTemplatedEmail(template, data, to, subject)

      // Assert
      expect(mockHttpService.post).toHaveBeenCalledTimes(1)
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/smtp/email',
        {
          templateId: 1,
          params: { name: 'Test User' },
          subject: 'Test Subject',
          to: [{ email: 'test@example.com' }],
          sender: {
            name: 'OTELO',
            email: 'noreply@otelo.beta.gouv.fr',
          },
        },
        {
          headers: {
            accept: 'application/json',
            'api-key': 'test-api-key',
            'content-type': 'application/json',
          },
        },
      )
    })

    it('should throw an error when sending templated email fails', async () => {
      // Arrange
      const template = '1'
      const data = { name: 'Test User' }
      const to = 'test@example.com'
      const subject = 'Test Subject'

      mockHttpService.post.mockImplementationOnce(() => {
        throw new Error('API Error')
      })

      // Act & Assert
      await expect(service.sendTemplatedEmail(template, data, to, subject)).rejects.toThrow('Failed to send templated email')
    })
  })
})
