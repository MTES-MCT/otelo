import { createMock } from '@golevelup/ts-jest'
import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from '~/users/users.service'
import { UsersController } from './users.controller'

describe('UsersController - importCsv', () => {
  let controller: UsersController
  let usersService: jest.Mocked<UsersService>

  beforeEach(async () => {
    const mockUsersService = createMock<UsersService>()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile()

    controller = module.get<UsersController>(UsersController)
    usersService = module.get(UsersService) as jest.Mocked<UsersService>
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  function makeCsvFile(content: string, mimetype = 'text/csv'): Express.Multer.File {
    return {
      buffer: Buffer.from(content, 'utf-8'),
      mimetype,
      fieldname: 'file',
      originalname: 'import.csv',
      encoding: 'utf-8',
      size: content.length,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    }
  }

  // --- File validation ---

  it('should reject when no file is uploaded', async () => {
    await expect(controller.importCsv(undefined as any)).rejects.toThrow(BadRequestException)
    await expect(controller.importCsv(undefined as any)).rejects.toThrow('No file uploaded')
  })

  it('should reject non-CSV mimetypes', async () => {
    const file = makeCsvFile('email;nom;prenom;referent', 'application/json')
    await expect(controller.importCsv(file)).rejects.toThrow(BadRequestException)
    await expect(controller.importCsv(file)).rejects.toThrow('File must be a CSV')
  })

  it('should accept text/csv mimetype', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 0, skipped: 0 })
    const file = makeCsvFile('email;nom;prenom;referent', 'text/csv')
    await expect(controller.importCsv(file)).resolves.toBeDefined()
  })

  it('should accept application/csv mimetype', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 0, skipped: 0 })
    const file = makeCsvFile('email;nom;prenom;referent', 'application/csv')
    await expect(controller.importCsv(file)).resolves.toBeDefined()
  })

  it('should accept application/vnd.ms-excel mimetype', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 0, skipped: 0 })
    const file = makeCsvFile('email;nom;prenom;referent', 'application/vnd.ms-excel')
    await expect(controller.importCsv(file)).resolves.toBeDefined()
  })

  // --- CSV parsing ---

  it('should parse valid CSV with semicolon delimiter', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 1, skipped: 0 })
    const csv = 'email;nom;prenom;referent\njean@test.com;Dupont;Jean;DDT 75'
    const file = makeCsvFile(csv)

    const result = await controller.importCsv(file)

    expect(usersService.importUsersFromCsv).toHaveBeenCalledWith([
      { email: 'jean@test.com', name: 'Jean Dupont', firstname: 'Jean', lastname: 'Dupont', referent: 'DDT 75' },
    ])
    expect(result.created).toBe(1)
    expect(result.totalRows).toBe(1)
  })

  it('should handle CSV without referent column', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 1, skipped: 0 })
    const csv = 'email;nom;prenom\njean@test.com;Dupont;Jean'
    const file = makeCsvFile(csv)

    const result = await controller.importCsv(file)

    expect(usersService.importUsersFromCsv).toHaveBeenCalledWith([
      { email: 'jean@test.com', name: 'Jean Dupont', firstname: 'Jean', lastname: 'Dupont', referent: undefined },
    ])
    expect(result.validationErrors).toHaveLength(0)
  })

  // --- Row validation (Zod) ---

  it('should reject rows with invalid email', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 0, skipped: 0 })
    const csv = 'email;nom;prenom;referent\nnot-an-email;Dupont;Jean;DDT'
    const file = makeCsvFile(csv)

    const result = await controller.importCsv(file)

    expect(result.validationErrors).toHaveLength(1)
    expect(result.validationErrors[0].row).toBe(2)
    expect(usersService.importUsersFromCsv).toHaveBeenCalledWith([])
  })

  it('should reject rows with empty email', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 0, skipped: 0 })
    const csv = 'email;nom;prenom;referent\n;Dupont;Jean;DDT'
    const file = makeCsvFile(csv)

    const result = await controller.importCsv(file)

    expect(result.validationErrors).toHaveLength(1)
    expect(usersService.importUsersFromCsv).toHaveBeenCalledWith([])
  })

  it('should reject rows with empty nom', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 0, skipped: 0 })
    const csv = 'email;nom;prenom;referent\njean@test.com;;Jean;DDT'
    const file = makeCsvFile(csv)

    const result = await controller.importCsv(file)

    expect(result.validationErrors).toHaveLength(1)
    expect(usersService.importUsersFromCsv).toHaveBeenCalledWith([])
  })

  it('should reject rows with empty prenom', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 0, skipped: 0 })
    const csv = 'email;nom;prenom;referent\njean@test.com;Dupont;;DDT'
    const file = makeCsvFile(csv)

    const result = await controller.importCsv(file)

    expect(result.validationErrors).toHaveLength(1)
    expect(usersService.importUsersFromCsv).toHaveBeenCalledWith([])
  })

  it('should validate each row independently and pass only valid ones', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 1, skipped: 0 })
    const csv = ['email;nom;prenom;referent', 'bad-email;Dupont;Jean;DDT', 'valid@test.com;Martin;Marie;DDT 93', ';NoEmail;Test;DDT'].join(
      '\n',
    )
    const file = makeCsvFile(csv)

    const result = await controller.importCsv(file)

    expect(result.validationErrors).toHaveLength(2)
    expect(result.validationErrors[0].row).toBe(2)
    expect(result.validationErrors[1].row).toBe(4)
    expect(usersService.importUsersFromCsv).toHaveBeenCalledWith([
      { email: 'valid@test.com', name: 'Marie Martin', firstname: 'Marie', lastname: 'Martin', referent: 'DDT 93' },
    ])
    expect(result.totalRows).toBe(3)
  })

  // --- Security: no extra fields injected ---

  it('should not pass extra CSV columns to the service', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 1, skipped: 0 })
    const csv = 'email;nom;prenom;referent;role;hasAccess;banned\njean@test.com;Dupont;Jean;DDT;ADMIN;true;false'
    const file = makeCsvFile(csv)

    await controller.importCsv(file)

    const passedRows = usersService.importUsersFromCsv.mock.calls[0][0]
    expect(passedRows).toHaveLength(1)
    expect(passedRows[0]).toEqual({
      email: 'jean@test.com',
      name: 'Jean Dupont',
      firstname: 'Jean',
      lastname: 'Dupont',
      referent: 'DDT',
    })
    // Zod strips unknown keys — role, hasAccess, banned must NOT leak through
    expect(passedRows[0]).not.toHaveProperty('role')
    expect(passedRows[0]).not.toHaveProperty('hasAccess')
    expect(passedRows[0]).not.toHaveProperty('banned')
  })

  // --- Edge cases ---

  it('should handle empty CSV (header only)', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 0, skipped: 0 })
    const csv = 'email;nom;prenom;referent'
    const file = makeCsvFile(csv)

    const result = await controller.importCsv(file)

    expect(result.totalRows).toBe(0)
    expect(result.validationErrors).toHaveLength(0)
    expect(usersService.importUsersFromCsv).toHaveBeenCalledWith([])
  })

  it('should skip empty lines in CSV', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 1, skipped: 0 })
    const csv = 'email;nom;prenom;referent\n\njean@test.com;Dupont;Jean;DDT\n\n'
    const file = makeCsvFile(csv)

    const result = await controller.importCsv(file)

    expect(usersService.importUsersFromCsv).toHaveBeenCalledWith([expect.objectContaining({ email: 'jean@test.com' })])
    expect(result.totalRows).toBe(1)
  })

  it('should handle UTF-8 content with accents', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 1, skipped: 0 })
    const csv = 'email;nom;prenom;referent\njean@test.com;Éléonore;François;Réf. DDT île-de-France'
    const file = makeCsvFile(csv)

    await controller.importCsv(file)

    expect(usersService.importUsersFromCsv).toHaveBeenCalledWith([
      {
        email: 'jean@test.com',
        name: 'François Éléonore',
        firstname: 'François',
        lastname: 'Éléonore',
        referent: 'Réf. DDT île-de-France',
      },
    ])
  })

  it('should return correct row numbers in validation errors (1-indexed + header)', async () => {
    usersService.importUsersFromCsv.mockResolvedValue({ created: 0, skipped: 0 })
    const csv = [
      'email;nom;prenom;referent',
      'valid@test.com;Dupont;Jean;DDT',
      'bad-email;Martin;Pierre;DDT',
      'also-bad;Durand;Luc;DDT',
    ].join('\n')
    const file = makeCsvFile(csv)

    const result = await controller.importCsv(file)

    // Row 3 in the file (index 1 in data + 2 for header offset) = row 3
    expect(result.validationErrors[0].row).toBe(3)
    expect(result.validationErrors[1].row).toBe(4)
  })
})
