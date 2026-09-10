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
 * Le `ZodValidationPipe` ne valide que si le paramètre est annoté avec une classe
 * `createZodDto`. Un type TypeScript est effacé à la compilation : le corps passe sans
 * être validé, en silence, et rien ne le signale.
 *
 * `strictSchemaDeclaration` ne répond pas au besoin : elle lève sur tout paramètre sans
 * DTO, `@Param('id')` compris, et à l'exécution.
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

  /** Les `@Body()` et `@Query()` entiers sans DTO `createZodDto`, donc non validés. */
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

          const paramtypes: unknown[] = Reflect.getMetadata('design:paramtypes', controller.prototype, method) ?? []

          for (const [key, meta] of Object.entries(args as Record<string, { index: number; data?: unknown }>)) {
            const [kind] = key.split(':')
            if (Number(kind) !== paramtype) continue
            // `@Body('champ')` extrait une valeur unique : pas d'entrée entière à valider.
            if (meta.data !== undefined) continue

            const metatype = paramtypes[meta.index] as { isZodDto?: boolean } | undefined
            if (!metatype?.isZodDto) {
              found.push({ controller: controller.name, method, index: meta.index })
            }
          }
        }
      }
    }

    return found
  }

  it('should route every full @Body() through a createZodDto class', () => {
    const offenders = unvalidatedInputs(RouteParamtypes.BODY)

    expect(offenders.map(({ controller, method }) => `${controller}.${method}()`)).toEqual([])
  })

  it('should route every full @Query() through a createZodDto class', () => {
    const offenders = unvalidatedInputs(RouteParamtypes.QUERY)

    expect(offenders.map(({ controller, method }) => `${controller}.${method}()`)).toEqual([])
  })

  /** Sans cette vérification, le test ci-dessus passerait au vert en n'inspectant rien. */
  it('should actually have controllers to inspect', () => {
    expect(controllerFiles(SRC).length).toBeGreaterThan(20)
  })
})
