import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common'

/**
 * Livraisons de PowerPoint en cours, menées après la réponse HTTP.
 *
 * Générer le PowerPoint, les classeurs Excel et envoyer le mail dépasse le délai
 * du routeur Scalingo (30 s avant le premier octet) : l'agent voyait une erreur
 * alors que le livrable partait bien. La demande est donc acquittée dès son
 * enregistrement et livrée ensuite.
 *
 * Le registre permet d'attendre la fin des livraisons à l'arrêt de l'application,
 * et aux tests d'observer leur issue.
 */
@Injectable()
export class PowerpointDeliveries implements OnApplicationShutdown {
  private readonly logger = new Logger(PowerpointDeliveries.name)
  private readonly pending = new Set<Promise<void>>()

  start(requestId: string, delivery: () => Promise<void>): void {
    const promise = delivery()
      .catch((error) => this.logger.error(`Livraison du PowerPoint ${requestId} interrompue`, error instanceof Error ? error.stack : error))
      .finally(() => this.pending.delete(promise))
    this.pending.add(promise)
  }

  async settled(): Promise<void> {
    await Promise.allSettled([...this.pending])
  }

  async onApplicationShutdown(): Promise<void> {
    await this.settled()
  }
}
