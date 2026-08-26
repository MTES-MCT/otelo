import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'

interface GeoEpciContour {
  code: string
  nom: string
  contour?: { type: string; coordinates: unknown }
}

/**
 * L'API Géo limite par IP, et nous a déjà refusé nos connexions pour avoir tiré les contours à
 * chaque rendu de page. On reste donc volontairement lent : petites vagues, pause entre chacune.
 * Le backfill est un one-shot, sa durée n'a aucune importance.
 */
const TAILLE_VAGUE = 5
const PAUSE_ENTRE_VAGUES_MS = 500
const TIMEOUT_MS = 15_000

@Injectable()
export class BackfillEpciContoursCommand {
  constructor(private readonly prisma: PrismaService) {}

  async execute(options: { dryRun: boolean; force: boolean }): Promise<void> {
    const epcis = await this.prisma.epci.findMany({
      select: { code: true, name: true, contour: { select: { epciCode: true } } },
      orderBy: { code: 'asc' },
    })

    const aTraiter = options.force ? epcis : epcis.filter((epci) => !epci.contour)
    const dejaPresents = epcis.length - aTraiter.length

    console.log(`${epcis.length} EPCI en base, ${dejaPresents} contour(s) déjà présent(s), ${aTraiter.length} à récupérer.`)
    if (options.dryRun) {
      console.log('Mode dry-run : aucune écriture en base (utiliser --write).')
    }

    let ecrits = 0
    let echecs = 0

    for (let i = 0; i < aTraiter.length; i += TAILLE_VAGUE) {
      const vague = aTraiter.slice(i, i + TAILLE_VAGUE)

      const resultats = await Promise.all(vague.map(async (epci) => ({ epci, contour: await this.recupererContour(epci.code) })))

      for (const { epci, contour } of resultats) {
        if (!contour) {
          console.log(`  ⚠ ${epci.code} (${epci.name}) : contour indisponible`)
          echecs++
          continue
        }

        if (!options.dryRun) {
          await this.prisma.epciContour.upsert({
            where: { epciCode: epci.code },
            create: { epciCode: epci.code, contour },
            update: { contour },
          })
        }
        ecrits++
      }

      const traites = Math.min(i + TAILLE_VAGUE, aTraiter.length)
      console.log(`  ${traites}/${aTraiter.length} — ${ecrits} ok, ${echecs} en échec`)

      if (traites < aTraiter.length) {
        await new Promise((resolve) => setTimeout(resolve, PAUSE_ENTRE_VAGUES_MS))
      }
    }

    console.log(`\nTerminé : ${ecrits} contour(s) ${options.dryRun ? 'récupérés (non écrits)' : 'écrits'}, ${echecs} en échec.`)
    if (echecs > 0) {
      console.log('Relancer la commande rejouera uniquement les EPCI sans contour (sauf avec --force).')
    }
  }

  private async recupererContour(code: string): Promise<GeoEpciContour['contour'] | null> {
    try {
      const response = await fetch(`https://geo.api.gouv.fr/epcis/${code}?fields=code,nom,contour`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (!response.ok) {
        return null
      }
      const data: GeoEpciContour = await response.json()
      return data.contour ?? null
    } catch (error) {
      console.log(`    ${code} : ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }
}
