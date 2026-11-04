import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants'
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum'

// Ce test charge tous les contrôleurs ; plusieurs importent ce paquet, distribué en ESM.
jest.mock('@thallesp/nestjs-better-auth', () => ({
  // biome-ignore lint/suspicious/noEmptyBlockStatements: allow empty block
  AllowAnonymous: () => () => {},
  // biome-ignore lint/suspicious/noEmptyBlockStatements: allow empty block
  OptionalAuth: () => () => {},
}))

/**
 * Le pipe de validation global ne valide que les paramètres qui portent un schéma :
 * `@Body({ schema })`, `@Query({ schema })`. Un type TypeScript est effacé à la
 * compilation : sans schéma, le corps passe sans être validé, en silence, et rien ne le
 * signale.
 */
describe('Validation des entrées de requête', () => {
  const SRC = join(__dirname)

  const controllerFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) return controllerFiles(path)
      return entry.endsWith('.controller.ts') ? [path] : []
    })

  type Offender = { controller: string; method: string; index: number }

  /** Les `@Body()` et `@Query()` entiers sans schéma, donc non validés. */
  const unvalidatedInputs = (paramtype: RouteParamtypes): Offender[] => {
    const found: Offender[] = []

    for (const file of controllerFiles(SRC)) {
      // Chargement dynamique : la liste des contrôleurs ne doit pas être tenue à la main,
      // sinon un contrôleur ajouté plus tard échapperait au contrôle sans que rien ne le dise.
      const moduleExports = require(file)

      for (const exported of Object.values(moduleExports)) {
        if (typeof exported !== 'function' || !exported.prototype) continue
        const controller = exported as new (...args: never[]) => unknown

        for (const method of Object.getOwnPropertyNames(controller.prototype)) {
          if (method === 'constructor') continue

          const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, controller, method)
          if (!args) continue

          for (const [key, meta] of Object.entries(args as Record<string, { index: number; data?: unknown; schema?: unknown }>)) {
            const [kind] = key.split(':')
            if (Number(kind) !== paramtype) continue
            // `@Body('champ')` extrait une valeur unique : pas d'entrée entière à valider.
            if (meta.data !== undefined) continue

            if (!meta.schema) {
              found.push({ controller: controller.name, method, index: meta.index })
            }
          }
        }
      }
    }

    return found
  }

  it('should give every full @Body() a validation schema', () => {
    const offenders = unvalidatedInputs(RouteParamtypes.BODY)

    expect(offenders.map(({ controller, method }) => `${controller}.${method}()`)).toEqual([])
  })

  it('should give every full @Query() a validation schema', () => {
    const offenders = unvalidatedInputs(RouteParamtypes.QUERY)

    expect(offenders.map(({ controller, method }) => `${controller}.${method}()`)).toEqual([])
  })

  /** Sans cette vérification, le test ci-dessus passerait au vert en n'inspectant rien. */
  it('should actually have controllers to inspect', () => {
    expect(controllerFiles(SRC).length).toBeGreaterThan(20)
  })
})
