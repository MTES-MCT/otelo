import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TInitScenario, TUpdateSimulationDto } from '~/schemas/scenarios/scenario'

@Injectable()
export class ScenariosService {
  constructor(private readonly prisma: PrismaService) {}

  async hasUserAccessTo(id: string, userId: string): Promise<boolean> {
    return !!(await this.prisma.scenario.findFirst({
      where: { id, userId },
    }))
  }

  async get(id: string) {
    const scenario = await this.prisma.scenario.findUniqueOrThrow({
      include: {
        epciScenarios: true,
        demographicEvolutionOmphaleCustom: true,
      },
      where: { id },
    })

    const sortedEpciScenarios = scenario.epciScenarios.sort((a, b) => {
      if (a.baseEpci === b.baseEpci) return 0
      return a.baseEpci ? -1 : 1
    })

    return {
      ...scenario,
      epciScenarios: sortedEpciScenarios,
    }
  }

  async list(userId: string) {
    return this.prisma.scenario.findMany({ where: { userId } })
  }

  async create(userId: string, data: TInitScenario) {
    const { epcis, demographicEvolutionOmphaleCustomIds, ...scenario } = data

    const epciScenariosData = Object.entries(epcis).map(([code, epciScenario]) => ({
      epciCode: code,
      ...epciScenario,
    }))

    const createdScenario = await this.prisma.scenario.create({
      data: {
        ...scenario,
        epciScenarios: {
          createMany: {
            data: epciScenariosData,
          },
        },
        user: { connect: { id: userId } },
      },
    })

    // If there are custom demographic evolution IDs, assign the scenario ID to them
    if (demographicEvolutionOmphaleCustomIds && demographicEvolutionOmphaleCustomIds.length > 0) {
      await this.prisma.demographicEvolutionOmphaleCustom.updateMany({
        where: {
          id: { in: demographicEvolutionOmphaleCustomIds },
          userId: userId,
          scenarioId: null, // Only update if not already assigned to a scenario
        },
        data: {
          scenarioId: createdScenario.id,
        },
      })
    }

    return createdScenario
  }

  async update(id: string, data: TUpdateSimulationDto) {
    const { epciScenarios, ...scenario } = data
    return this.prisma.scenario.update({
      data: {
        ...scenario,
        ...(epciScenarios
          ? {
              epciScenarios: {
                updateMany: Object.entries(epciScenarios).map(
                  ([
                    epciCode,
                    { b2_tx_disparition, b2_tx_restructuration, b2_tx_rs, b2_tx_vacance, b2_tx_vacance_longue, b2_tx_vacance_courte },
                  ]) => ({
                    where: {
                      scenarioId: id,
                      epciCode,
                    },
                    data: {
                      b2_tx_restructuration,
                      b2_tx_disparition,
                      b2_tx_vacance,
                      b2_tx_vacance_longue,
                      b2_tx_vacance_courte,
                      b2_tx_rs,
                    },
                  }),
                ),
              },
            }
          : {}),
      },
      where: { id },
    })
  }

  async delete(userId: string, id: string) {
    return this.prisma.scenario.delete({ where: { id, userId } })
  }
}
