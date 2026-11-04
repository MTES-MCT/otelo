import { INestApplication, ModuleMetadata } from '@nestjs/common'
import { APP_PIPE } from '@nestjs/core'
import { Test, TestingModuleBuilder } from '@nestjs/testing'
import { ZodValidationPipe } from 'nestjs-zod'

export type HttpTestAppOptions = {
  /** Ajuste le module avant compilation : `useMocker`, `overrideGuard`, etc. */
  configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder
  /** Champs posés sur chaque requête, en plus de `user`. */
  request?: Record<string, unknown>
}

/**
 * Monte un contrôleur derrière un vrai serveur HTTP, avec le pipe de validation global.
 *
 * Instancier le contrôleur directement ne validerait rien : le pipe se déclenche sur les
 * métadonnées du paramètre, que seule la traversée du pipeline Nest fournit. Aucune garde
 * n'est enregistrée — l'objet ici est le contrat d'entrée.
 */
export async function createHttpTestApp(
  metadata: Pick<ModuleMetadata, 'controllers' | 'providers' | 'imports'>,
  user: Record<string, unknown> = { id: 'user-test', role: 'USER', hasAccess: true },
  options: HttpTestAppOptions = {},
): Promise<INestApplication> {
  const builder = Test.createTestingModule({
    ...metadata,
    providers: [...(metadata.providers ?? []), { provide: APP_PIPE, useClass: ZodValidationPipe }],
  })
  const moduleRef = await (options.configure ? options.configure(builder) : builder).compile()

  const app = moduleRef.createNestApplication({ logger: false })
  // `@User()` lit `request.user`, que la garde d'authentification pose en production.
  app.use((req: Record<string, unknown>, _res: unknown, next: () => void) => {
    req.user = user
    Object.assign(req, options.request)
    next()
  })

  await app.init()
  return app
}
