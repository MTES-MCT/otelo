/**
 * Construit un exemple déterministe à partir d'un schéma zod, pour les tests de contrat.
 *
 * `full` renseigne aussi les champs optionnels, `minimal` ne garde que les champs requis.
 * Les raffinements (`refine`, `superRefine`) et les motifs `regex` ne sont pas résolus : les
 * routes qui en dépendent reçoivent un exemple écrit à la main dans le test.
 */
export type SampleMode = 'full' | 'minimal'

const SAMPLE_UUID = '00000000-0000-4000-8000-000000000001'
const SAMPLE_DATE = new Date('2026-01-15T10:00:00.000Z')

// biome-ignore lint/suspicious/noExplicitAny: les définitions internes de zod ne sont pas typées publiquement
type ZodDef = Record<string, any>
type ZodLike = { _zod: { def: ZodDef } }

const checksOf = (def: ZodDef): ZodDef[] => (def.checks ?? []).map((check: ZodLike) => check._zod.def)

const isOmittable = (schema: ZodLike): boolean => ['optional', 'default'].includes(schema._zod.def.type)

const SAMPLE_BY_FORMAT: Record<string, string> = {
  email: 'user@example.org',
  uuid: SAMPLE_UUID,
  url: 'https://example.org',
  datetime: '2026-01-15T10:00:00.000Z',
  date: '2026-01-15',
}

function sampleString(def: ZodDef): string {
  const checks = checksOf(def)
  const format = def.format ?? checks.find((check) => check.format && check.format in SAMPLE_BY_FORMAT)?.format
  if (format && format in SAMPLE_BY_FORMAT) return SAMPLE_BY_FORMAT[format]
  const min = checks.find((check) => check.check === 'min_length')?.minimum ?? 0
  const max = checks.find((check) => check.check === 'max_length')?.maximum ?? Number.POSITIVE_INFINITY
  const base = 'sample'
  const padded = base.length >= min ? base : base.padEnd(min, 'x')
  return padded.slice(0, Math.max(min, Math.min(padded.length, max)))
}

function sampleNumber(def: ZodDef): number {
  const checks = checksOf(def)
  const lower = checks.find((check) => check.check === 'greater_than')
  const upper = checks.find((check) => check.check === 'less_than')
  const integer = checks.some((check) => check.format === 'safeint')
  let value = 1
  if (lower) value = lower.inclusive ? lower.value : lower.value + 1
  if (upper && value > upper.value) value = upper.inclusive ? upper.value : upper.value - 1
  return integer ? Math.ceil(value) : value
}

export function zodSample(schema: ZodLike, mode: SampleMode = 'full', seen: Set<unknown> = new Set()): unknown {
  const def = schema._zod.def

  switch (def.type) {
    case 'string':
      return sampleString(def)
    case 'number':
      return sampleNumber(def)
    case 'boolean':
      return true
    case 'date':
      return SAMPLE_DATE
    case 'enum':
      return Object.values(def.entries)[0]
    case 'literal':
      return def.values[0]
    case 'optional':
    case 'nullable':
    case 'default':
    case 'readonly':
    case 'nonoptional':
    case 'prefault':
    case 'catch':
      return zodSample(def.innerType, mode, seen)
    case 'pipe':
      // `z.preprocess` place une transformation en entrée : l'exemple vient alors de la sortie.
      return zodSample(def.in._zod.def.type === 'transform' ? def.out : def.in, mode, seen)
    case 'union':
      return zodSample(def.options[0], mode, seen)
    case 'array': {
      const min = checksOf(def).find((check) => check.check === 'min_length')?.minimum ?? 1
      return Array.from({ length: Math.max(1, min) }, () => zodSample(def.element, mode, seen))
    }
    case 'record':
      return { [String(zodSample(def.keyType, mode, seen))]: zodSample(def.valueType, mode, seen) }
    case 'object': {
      if (seen.has(schema)) return {}
      const nextSeen = new Set(seen).add(schema)
      const entries = Object.entries<ZodLike>(def.shape)
        .filter(([, field]) => mode === 'full' || !isOmittable(field))
        .map(([key, field]) => [key, zodSample(field, mode, nextSeen)])
      return Object.fromEntries(entries)
    }
    case 'lazy':
      return zodSample(def.getter(), mode, seen)
    default:
      return undefined
  }
}
