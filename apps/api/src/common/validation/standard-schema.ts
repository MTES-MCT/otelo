import { BadRequestException, HttpStatus, StandardSchemaValidationPipe } from '@nestjs/common'
import type { SwaggerDocumentOptions } from '@nestjs/swagger'
import { z } from 'zod'

/**
 * Pipe de validation global, branché sur le support natif des Standard Schemas de Nest :
 * `@Body({ schema })`, `@Query({ schema })`, `@Param({ schema })`.
 *
 * Le corps d'erreur reprend à l'identique celui publié jusqu'ici (`message` fixe, détail
 * dans `errors`) : les consommateurs de l'API externe s'appuient dessus.
 */
export function createValidationPipe(): StandardSchemaValidationPipe {
  return new StandardSchemaValidationPipe({
    exceptionFactory: (issues) =>
      new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: issues,
      }),
  })
}

type StandardSchemaConverter = NonNullable<SwaggerDocumentOptions['standardSchemaConverter']>

/**
 * Traduit un schéma zod en schéma OpenAPI 3.0 pour `@nestjs/swagger`.
 *
 * Le convertisseur par défaut de Nest échoue sur `z.date()`, qui n'a pas d'équivalent JSON
 * Schema : le document interne ne se générait plus. Une date y est décrite comme une chaîne
 * `date-time`, ce qu'elle devient une fois sérialisée en JSON.
 *
 * Les schémas sont toujours décrits côté entrée, réponses comprises, comme le faisait la
 * documentation publiée jusqu'ici : la décrire côté sortie ajouterait notamment
 * `additionalProperties: false` à chaque objet.
 */
export const zodOpenApiConverter: StandardSchemaConverter = (schema) => {
  if (!(schema instanceof z.ZodType)) return undefined

  const { definitions, ...root } = z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io: 'input',
    unrepresentable: 'any',
    override: (ctx) => {
      if (ctx.zodSchema._zod.def.type === 'date') {
        ctx.jsonSchema.type = 'string'
        ctx.jsonSchema.format = 'date-time'
      }
    },
  }) as Record<string, unknown> & { definitions?: Record<string, unknown> }

  return { schema: root, components: definitions ?? {} }
}
