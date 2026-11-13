import { Test, TestingModule } from '@nestjs/testing'
import type { Browser, Page } from 'puppeteer'
import { ChartGenerationService } from './chart-generation.service'

describe('ChartGenerationService', () => {
  let service: ChartGenerationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChartGenerationService],
    }).compile()

    service = module.get<ChartGenerationService>(ChartGenerationService)
  })

  const fakeBrowser = (page?: Partial<Page>) =>
    ({
      close: jest.fn().mockResolvedValue(undefined),
      newPage: jest.fn().mockResolvedValue({ close: jest.fn().mockResolvedValue(undefined), ...page }),
    }) as unknown as jest.Mocked<Browser>

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // Un Chromium par graphique multipliait les démarrages, et un seul démarrage
  // bloqué faisait échouer tout l'export.
  it('lance un seul Chromium pour la durée de la tâche puis le referme', async () => {
    const browser = fakeBrowser()
    const launch = jest.spyOn(service as never, 'launchBrowser').mockResolvedValue(browser as never)

    const result = await service.withBrowser(async (received) => {
      expect(received).toBe(browser)
      return 'rendu'
    })

    expect(result).toBe('rendu')
    expect(launch).toHaveBeenCalledTimes(1)
    expect(browser.close).toHaveBeenCalledTimes(1)
  })

  // Un Chromium resté ouvert après un échec alourdissait le conteneur et
  // ralentissait les démarrages suivants.
  it('referme Chromium même quand la tâche échoue', async () => {
    const browser = fakeBrowser()
    jest.spyOn(service as never, 'launchBrowser').mockResolvedValue(browser as never)

    await expect(
      service.withBrowser(async () => {
        throw new Error('rendu impossible')
      }),
    ).rejects.toThrow('rendu impossible')

    expect(browser.close).toHaveBeenCalledTimes(1)
  })

  it('referme la page du graphique même quand le rendu échoue', async () => {
    const close = jest.fn().mockResolvedValue(undefined)
    const browser = fakeBrowser({
      close,
      setViewport: jest.fn().mockResolvedValue(undefined),
      setContent: jest.fn().mockResolvedValue(undefined),
      waitForFunction: jest.fn().mockRejectedValue(new Error('canvas absent')),
    } as Partial<Page>)
    jest.spyOn(service as never, 'generateRechartsHTML').mockReturnValue('<canvas></canvas>' as never)

    await expect(service.generateChartImage({ type: 'annual-needs', data: {}, width: 100, height: 100 } as never, browser)).rejects.toThrow(
      'canvas absent',
    )

    expect(close).toHaveBeenCalledTimes(1)
  })
})
