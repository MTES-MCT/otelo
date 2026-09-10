import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { PATH_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants'
import { ACCESS_CONTROL_KEY, isInternalOnly, type TModelAccess } from '~/common/decorators/control-access.decorator'

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => (target: object, key?: string) => {
    // Reproduit `SetMetadata('PUBLIC', true)` : c'est cette marque que le test cherche.
    Reflect.defineMetadata('PUBLIC', true, key ? (target as Record<string, object>)[key] : target)
  },
  // biome-ignore lint/suspicious/noEmptyBlockStatements: allow empty block
  OptionalAuth: () => () => {},
}))

/**
 * Chaque route doit déclarer qui peut y accéder : `@AccessControl`, `@AllowAnonymous` ou
 * un garde explicite. Sans cela, un contrôle enfoui dans le code reste introuvable pour
 * qui relit les décorateurs, et non protégé si le guard venait à changer.
 */
describe('Déclaration du contrôle d’accès des routes', () => {
  const HTTP_METHOD_METADATA = 'method'
  const GUARDS_METADATA = '__guards__'

  const controllerFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) return controllerFiles(path)
      return entry.endsWith('.controller.ts') ? [path] : []
    })

  const isDeclared = (controller: object, handler: object): boolean => {
    for (const target of [handler, controller]) {
      if (Reflect.getMetadata(ACCESS_CONTROL_KEY, target)) return true
      if (Reflect.getMetadata('PUBLIC', target)) return true
      if (Reflect.getMetadata(GUARDS_METADATA, target)) return true
    }
    return false
  }

  const undeclaredRoutes = (): string[] => {
    const found: string[] = []

    for (const file of controllerFiles(__dirname)) {
      const moduleExports = require(file)

      for (const exported of Object.values(moduleExports)) {
        if (typeof exported !== 'function' || !exported.prototype) continue
        const controller = exported as { prototype: Record<string, object>; name: string }
        if (Reflect.getMetadata(PATH_METADATA, controller) === undefined) continue

        for (const name of Object.getOwnPropertyNames(controller.prototype)) {
          if (name === 'constructor') continue
          const handler = controller.prototype[name]
          if (Reflect.getMetadata(HTTP_METHOD_METADATA, handler) === undefined) continue
          // Une méthode sans paramètre de route reste une route (ex. `@Get()` sans argument).
          Reflect.getMetadata(ROUTE_ARGS_METADATA, controller, name)

          if (!isDeclared(controller, handler)) {
            found.push(`${controller.name}.${name}()`)
          }
        }
      }
    }

    return found
  }

  it('should have every route declare its access explicitly', () => {
    expect(undeclaredRoutes()).toEqual([])
  })

  /** Sans quoi le test ci-dessus passerait au vert en n'inspectant rien. */
  it('should actually have controllers to inspect', () => {
    expect(controllerFiles(__dirname).length).toBeGreaterThan(20)
  })

  /**
   * Les routes non ouvertes au rôle USER portent `@ExcludeOpenApi()`. Le décorateur est
   * explicite plutôt que dérivé de `@AccessControl` ; ce test est la contrepartie.
   */
  describe('documentation OpenAPI', () => {
    const API_EXCLUDE_ENDPOINT = 'swagger/apiExcludeEndpoint'
    const API_EXCLUDE_CONTROLLER = 'swagger/apiExcludeController'

    /** `[true]` sur une classe, `{ disable: true }` sur une méthode selon la version. */
    const isExcluded = (value: unknown): boolean => {
      if (value === true) return true
      if (Array.isArray(value)) return value[0] === true
      return typeof value === 'object' && value !== null && (value as { disable?: unknown }).disable === true
    }

    const isHiddenFromDocs = (controller: object, handler: object): boolean =>
      isExcluded(Reflect.getMetadata(API_EXCLUDE_ENDPOINT, handler)) || isExcluded(Reflect.getMetadata(API_EXCLUDE_CONTROLLER, controller))

    const publishedInternalRoutes = (): string[] => {
      const found: string[] = []

      for (const file of controllerFiles(__dirname)) {
        const moduleExports = require(file)

        for (const exported of Object.values(moduleExports)) {
          if (typeof exported !== 'function' || !exported.prototype) continue
          const controller = exported as { prototype: Record<string, object>; name: string }
          if (Reflect.getMetadata(PATH_METADATA, controller) === undefined) continue

          for (const name of Object.getOwnPropertyNames(controller.prototype)) {
            if (name === 'constructor') continue
            const handler = controller.prototype[name]
            if (Reflect.getMetadata(HTTP_METHOD_METADATA, handler) === undefined) continue

            const access = (Reflect.getMetadata(ACCESS_CONTROL_KEY, handler) ?? Reflect.getMetadata(ACCESS_CONTROL_KEY, controller)) as
              | TModelAccess
              | undefined

            if (!access || !isInternalOnly(access)) continue
            if (isHiddenFromDocs(controller, handler)) continue

            found.push(`${controller.name}.${name}()`)
          }
        }
      }

      return found
    }

    it('should keep every route closed to plain users out of the published documentation', () => {
      expect(publishedInternalRoutes()).toEqual([])
    })
  })
})
