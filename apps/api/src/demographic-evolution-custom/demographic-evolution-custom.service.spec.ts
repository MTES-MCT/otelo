import { BadRequestException } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionCustomService } from './demographic-evolution-custom.service'

describe('DemographicEvolutionCustomService.parseUploadedFile', () => {
  const service = new DemographicEvolutionCustomService({} as PrismaService)

  const toBuffer = (lines: string[]) => Buffer.from(lines.join('\n'), 'utf-8')

  it('should sum values using a comma as decimal separator', async () => {
    const buffer = toBuffer(['ZONE;SEXE;AGE;MENAGES_2018;MENAGES_2030', 'Z1;H;20;12,5;1 000,25', 'Z1;F;20;7,5;0,75'])

    await expect(service.parseUploadedFile(buffer, 'text/csv')).resolves.toEqual([
      { value: 20, year: 2018 },
      { value: 1001, year: 2030 },
    ])
  })

  it('should still sum values using a dot as decimal separator', async () => {
    const buffer = toBuffer(['ZONE;SEXE;AGE;MENAGES_2018', 'Z1;H;20;12.5', 'Z1;F;20;7'])

    await expect(service.parseUploadedFile(buffer, 'text/csv')).resolves.toEqual([{ value: 19.5, year: 2018 }])
  })

  it('should ignore empty cells', async () => {
    const buffer = toBuffer(['ZONE;SEXE;AGE;MENAGES_2018', 'Z1;H;20;', 'Z1;F;20;3,5'])

    await expect(service.parseUploadedFile(buffer, 'text/csv')).resolves.toEqual([{ value: 3.5, year: 2018 }])
  })

  it('should reject a non numeric value with its column and line', async () => {
    const buffer = toBuffer(['ZONE;SEXE;AGE;MENAGES_2018', 'Z1;H;20;12,5', 'Z1;F;20;abc'])

    const result = service.parseUploadedFile(buffer, 'text/csv')

    await expect(result).rejects.toThrow(BadRequestException)
    await expect(result).rejects.toThrow('Valeur invalide "abc" dans MENAGES_2018, ligne 3')
  })
})
