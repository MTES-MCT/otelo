import { INestApplication } from '@nestjs/common'
import { ModuleMetadata } from '@nestjs/common/interfaces'
import { APP_PIPE } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { ZodValidationPipe } from 'nestjs-zod'

/**
 * Monte un contrôleur derrière un vrai serveur HTTP, avec le `ZodValidationPipe` global.
 *
 * Instancier le contrôleur directement ne validerait rien : le pipe se déclenche sur le
 * metatype, que seule la traversée du pipeline Nest fournit. Aucune garde n'est
 * enregistrée — l'objet ici est le contrat d'entrée.
 */
export async function createHttpTestApp(
  metadata: Pick<ModuleMetadata, 'controllers' | 'providers' | 'imports'>,
  user: Record<string, unknown> = { id: 'user-test', role: 'USER', hasAccess: true },
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    ...metadata,
    providers: [...(metadata.providers ?? []), { provide: APP_PIPE, useClass: ZodValidationPipe }],
  }).compile()

  const app = moduleRef.createNestApplication()
  // `@User()` lit `request.user`, que la garde d'authentification pose en production.
  app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
    req.user = user
    next()
  })

  await app.init()
  return app
}
