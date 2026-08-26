import { createMock, type DeepMocked } from '@golevelup/ts-jest'
import { Test, type TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { ImportProjectionsCommand } from './import-projections.command'

/** Fichier réel : la commande contrôle l'existence des classeurs avant toute autre chose. */
const EXISTING_FILE = './package.json'

describe('ImportProjectionsCommand', () => {
  let command: ImportProjectionsCommand
  let prisma: DeepMocked<PrismaService>

  beforeEach(async () => {
    prisma = createMock<PrismaService>()
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImportProjectionsCommand, { provide: PrismaService, useValue: prisma }],
    }).compile()

    command = module.get(ImportProjectionsCommand)
  })

  it('should be defined', () => {
    expect(command).toBeDefined()
  })

  it('refuse de tourner sans fichier', async () => {
    await expect(command.execute({ write: false })).rejects.toThrow(/--epci-file et\/ou --bh-file/)
  })

  it('refuse une feuille inconnue plutôt que de l’ignorer', async () => {
    await expect(command.execute({ bhFile: EXISTING_FILE, only: ['Population_totales'], write: false })).rejects.toThrow(
      /Feuille inconnue : Population_totales/,
    )
  })

  it('refuse un millésime absent de data_pack_versions', async () => {
    // Contrairement à `import-csv`, la commande ne crée pas le millésime à la volée : ces données
    // visent un millésime existant, en créer un par inadvertance passerait inaperçu.
    prisma.dataPackVersion.findUnique.mockResolvedValue(null)

    await expect(command.execute({ bhFile: EXISTING_FILE, millesime: '2099', write: false })).rejects.toThrow(/Millésime « 2099 » inconnu/)
    expect(prisma.dataPackVersion.create).not.toHaveBeenCalled()
  })

  it('retombe sur le millésime actif quand aucun n’est précisé', async () => {
    prisma.dataPackVersion.findFirst.mockResolvedValue({
      millesime: '2022',
      label: 'Millésime 2022',
      isActive: true,
      createdAt: new Date(),
    })
    prisma.projectionZone.findMany.mockResolvedValue([] as never)

    // La commande s'arrête sur le référentiel vide, ce qui prouve qu'elle a passé la résolution
    // du millésime sans exiger l'option.
    await expect(command.execute({ bhFile: EXISTING_FILE, write: false })).rejects.toThrow(/projection_zones est vide/)
    expect(prisma.dataPackVersion.findFirst).toHaveBeenCalledWith({ where: { isActive: true } })
  })

  it('refuse d’importer tant que le référentiel de zones n’est pas en place', async () => {
    // Les tables de mesures ont une clé étrangère vers `projection_zones` : sans la migration qui
    // la peuple, chaque ligne serait rejetée.
    prisma.dataPackVersion.findUnique.mockResolvedValue({
      millesime: '2022',
      label: 'Millésime 2022',
      isActive: true,
      createdAt: new Date(),
    })
    prisma.projectionZone.findMany.mockResolvedValue([] as never)

    await expect(command.execute({ bhFile: EXISTING_FILE, millesime: '2022', write: false })).rejects.toThrow(/projection_zones est vide/)
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled()
  })

  it('signale un classeur introuvable en rappelant depuis où les chemins sont résolus', async () => {
    // L'erreur la plus probable : les classeurs vivent hors du dépôt et la commande tourne depuis
    // `apps/api`, donc un chemin relatif mal compté. Un ENOENT brut d'exceljs n'aiderait pas.
    await expect(command.execute({ bhFile: './classeur-absent.xlsx', write: false })).rejects.toThrow(
      /Fichier introuvable.*résolus depuis/s,
    )
  })

  it('exige la table de passage pour régénérer le référentiel', async () => {
    await expect(command.execute({ bhFile: EXISTING_FILE, emitZonesSql: './zones.sql', write: false })).rejects.toThrow(
      /--emit-zones-sql requiert --passage-file/,
    )
  })
})
