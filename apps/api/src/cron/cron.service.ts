import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron, CronExpression } from '@nestjs/schedule'
import { firstValueFrom } from 'rxjs'
import { z } from 'zod'
import { anonymizeEmail } from '~/common/utils/email-anonymizer'
import { PrismaService } from '~/db/prisma.service'
import { DossierNode, GraphQLResponse } from './interfaces/demarches-simplifiees.interface'

const query = `
    query GetDossiers($after: String, $id: Int!) {
        demarche(number: $id) {
            id
            title
            dossiers(after: $after, first: 100) {
            pageInfo {
                hasPreviousPage
                hasNextPage
                startCursor
                endCursor
            }
            nodes {
                id
                state
                dateDepot
                dateDerniereModification
                usager {
                 email
                }
                champs {
                  id
                  label
                  ... on TextChamp {
                    value
                  }
                  ... on RepetitionChamp {
                      champs {
                        id
                        label
                        ... on TextChamp {
                          value
                        }
                      }
                  }
                }
              }
            }
        }
    }
`

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name)
  private readonly graphqlUrl: string
  private readonly graphqlToken: string
  private readonly demarcheId: number

  constructor(
    private readonly httpService: HttpService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.graphqlUrl = z.string().parse(this.configService.get<string>('DEMARCHES_SIMPLIFIEES_URL'))
    this.graphqlToken = z.string().parse(this.configService.get<string>('DEMARCHES_SIMPLIFIEES_TOKEN'))
    this.demarcheId = z
      .string()
      .transform((val) => parseInt(val))
      .parse(this.configService.get<string>('DEMARCHES_SIMPLIFIEES_DEMARCHE_ID'))
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async handleUserAccessUpdate() {
    this.logger.log('Starting user access update CRON job')

    try {
      await this.processAllDossiers()
      this.logger.log('User access update CRON job completed successfully')
    } catch (error) {
      this.logger.error('Error in user access update CRON job:', error)
    }
  }

  private async processAllDossiers(): Promise<void> {
    let hasNextPage = true
    let cursor: string | null = null
    const acceptedEmails = new Set<string>()

    while (hasNextPage) {
      try {
        const response = await this.fetchDossiers(cursor)
        const dossiers = response.data.demarche.dossiers
        this.processDossiersPage(dossiers.nodes, acceptedEmails)
        hasNextPage = dossiers.pageInfo.hasNextPage
        cursor = dossiers.pageInfo.endCursor
        this.logger.log(`Processed page, hasNextPage: ${hasNextPage}`)
      } catch (error) {
        this.logger.error('Error fetching dossiers:', error)
        break
      }
    }
    await this.updateUserAccess(acceptedEmails)
  }

  private processDossiersPage(nodes: DossierNode[], acceptedEmails: Set<string>): void {
    for (const dossier of nodes) {
      if (dossier.state === 'accepte') {
        const emails = this.extractEmailsFromDossier(dossier)
        emails.forEach((email) => {
          acceptedEmails.add(email.toLowerCase())
          this.logger.debug(`Found accepted dossier for email: ${anonymizeEmail(email)}`)
        })
      }
    }
  }

  private extractEmailsFromDossier(dossier: DossierNode): string[] {
    const emails: string[] = []

    // Add main usager email
    if (dossier.usager?.email) {
      emails.push(dossier.usager.email)
    }

    // Extract mail_referent and mails from champs
    for (const champ of dossier.champs || []) {
      if (champ.label === 'Adresse email' && champ.value) {
        emails.push(champ.value)
      }

      // Additional emails (repetition field or simple text field)
      if (champ.label === 'Adresses email des utilisateurs au sein de votre structure (en plus du référent Otelo)') {
        if (champ.champs) {
          // RepetitionChamp case
          champ.champs.forEach((subChamp) => {
            if (subChamp.value) {
              emails.push(subChamp.value)
            }
          })
        } else if (champ.value) {
          // Simple text field case - split by comma/newline
          const additionalEmails = champ.value
            .split(/[,\n;]+/)
            .map((email) => email.trim())
            .filter((email) => email)
          emails.push(...additionalEmails)
        }
      }
    }

    return [...new Set(emails.filter((email) => email && email.includes('@')))]
  }

  private async fetchDossiers(cursor: string | null = null): Promise<GraphQLResponse> {
    const variables: { after?: string; id: number } = {
      id: this.demarcheId,
      ...(cursor && { after: cursor }),
    }

    const response = await firstValueFrom(
      this.httpService.post<GraphQLResponse>(
        this.graphqlUrl,
        {
          query,
          variables,
        },
        {
          headers: {
            Authorization: `Bearer ${this.graphqlToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    )

    return response.data
  }

  private async updateUserAccess(acceptedEmails: Set<string>): Promise<void> {
    if (acceptedEmails.size === 0) {
      this.logger.log('No accepted dossiers found')
      return
    }

    try {
      const updateResult = await this.prismaService.user.updateMany({
        where: {
          AND: [
            {
              email: {
                in: Array.from(acceptedEmails),
              },
              engaged: false,
            },
          ],
        },
        data: {
          engaged: true,
          hasAccess: true,
        },
      })

      this.logger.log(`Updated ${updateResult.count} users with access permissions`)
    } catch (error) {
      this.logger.error('Error updating user access:', error)
      throw error
    }
  }
}
