import { Logger } from '@nestjs/common'
import { env } from '~/config/env'

/**
 * Adresses des intermédiaires réseau autorisés à annoncer l'adresse du visiteur.
 *
 * Valeurs par défaut : les adresses de sortie de la plateforme d'hébergement en région
 * osc-fr1, obtenues par `dig +short egress.osc-fr1.scalingo.com`. Elles peuvent changer,
 * avec un préavis annoncé de 30 jours — d'où la surcharge par `TRUSTED_PROXY_IPS`, qui
 * permet d'y répondre sans redéployer.
 *
 * Limite connue, à ne pas oublier : ces adresses sont **mutualisées entre tous les
 * clients de la région**, pas propres à Otelo. Un tiers hébergé sur la même plateforme
 * en sort donc lui aussi, et pourrait annoncer une adresse de son choix. La protection
 * reste très supérieure à l'absence de cloisonnement, mais ce n'est pas une frontière de
 * sécurité : la refermer suppose une adresse de sortie dédiée.
 */
const DEFAULT_TRUSTED_PROXIES = '171.33.105.206/32,171.33.92.211/32'

export const TRUSTED_PROXIES: string[] = (env.TRUSTED_PROXY_IPS ?? DEFAULT_TRUSTED_PROXIES)
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)

/**
 * Octets d'une adresse IPv4, ou `null` si la valeur n'en est pas une.
 *
 * Les formes IPv4 encapsulées en IPv6 (`::ffff:88.10.10.10`) sont dépliées : elles
 * désignent la même machine, et les traiter séparément ferait deux compteurs pour un
 * seul visiteur. Une adresse IPv6 véritable renvoie `null` : elle ne peut de toute façon
 * pas appartenir à un réseau IPv4, et sera donc retenue telle quelle comme adresse de
 * visiteur.
 */
function toIpv4Bytes(value: string): number[] | null {
  const candidate = value.toLowerCase().startsWith('::ffff:') ? value.slice(7) : value
  const parts = candidate.split('.')

  if (parts.length !== 4) {
    return null
  }

  const bytes = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : Number.NaN))

  return bytes.every((byte) => byte >= 0 && byte <= 255) ? bytes : null
}

type Cidr = { bytes: number[]; prefix: number }

const PARSED_TRUSTED_PROXIES: Cidr[] = TRUSTED_PROXIES.map((entry) => {
  const [address, prefixPart] = entry.split('/')
  const bytes = toIpv4Bytes(address)

  if (!bytes) {
    return null
  }

  if (prefixPart === undefined) {
    return { bytes, prefix: 32 }
  }

  const prefix = /^\d{1,2}$/.test(prefixPart) ? Number(prefixPart) : Number.NaN

  return prefix >= 0 && prefix <= 32 ? { bytes, prefix } : null
}).filter((entry): entry is Cidr => entry !== null)

function isTrustedProxy(value: string): boolean {
  const bytes = toIpv4Bytes(value)

  if (!bytes) {
    return false
  }

  return PARSED_TRUSTED_PROXIES.some(({ bytes: netBytes, prefix }) => {
    for (let bit = 0; bit < prefix; bit += 8) {
      const index = bit >> 3
      const mask = (0xff << (8 - Math.min(8, prefix - bit))) & 0xff
      if ((bytes[index] & mask) !== (netBytes[index] & mask)) {
        return false
      }
    }
    return true
  })
}

/**
 * Adresse du visiteur, déduite d'une chaîne `X-Forwarded-For`.
 *
 * La chaîne est parcourue **de droite à gauche** : chaque intermédiaire ajoute
 * l'adresse de celui qui l'a contacté, si bien que la valeur la plus à droite est la
 * seule qu'un appelant ne puisse pas écrire lui-même. On saute les intermédiaires
 * connus et on retient la première adresse inconnue. Prendre la valeur de gauche — le
 * réflexe courant — laisserait n'importe qui choisir son compteur, et surtout épuiser
 * celui d'un tiers en annonçant son adresse.
 *
 * Renvoie `null` si la chaîne est absente, illisible, ou entièrement composée
 * d'intermédiaires connus : mieux vaut une absence franche, que l'appelant traitera,
 * qu'une adresse dont on ne peut rien dire.
 *
 * Cette règle est volontairement la même que celle appliquée par better-auth sur les
 * routes d'authentification : les deux limiteurs de débit doivent compter à l'identique,
 * sans quoi un même visiteur se verrait attribuer deux identités selon la route.
 */
export function resolveClientIp(forwardedFor: string | string[] | undefined | null): string | null {
  if (!forwardedFor) {
    return null
  }

  const chain = (Array.isArray(forwardedFor) ? forwardedFor.join(',') : forwardedFor)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  for (let index = chain.length - 1; index >= 0; index--) {
    const address = chain[index]

    if (isTrustedProxy(address)) {
      continue
    }

    const ipv4 = toIpv4Bytes(address)
    if (ipv4) {
      return ipv4.join('.')
    }

    // Adresse IPv6 : retenue telle quelle, faute de pouvoir appartenir à un réseau IPv4.
    return address.includes(':') ? address : null
  }

  return null
}

const logger = new Logger('ClientIp')
const UNRESOLVED_LOG_INTERVAL_MS = 300_000
let lastUnresolvedLogAt = 0

/**
 * Identifiant de comptage du limiteur de débit NestJS.
 *
 * On lit l'en-tête plutôt que `req.ip` — donc sans dépendre du réglage `trust proxy`
 * d'Express. Ce réglage suppose de connaître l'adresse depuis laquelle le routeur de la
 * plateforme ouvre la connexion, une adresse interne et non documentée : s'y fier
 * ferait retomber tous les visiteurs sur un compteur commun le jour où cet adressage
 * change, et **sans aucun signal**.
 *
 * Le repli sur `req.ip` conserve le comportement antérieur plutôt que de bloquer, mais
 * il est bruyant : better-auth ne signale son propre repli qu'une fois par processus, ce
 * qui ne constitue pas une alerte exploitable. Ici l'anomalie se répète tant qu'elle
 * dure, et le message porte la chaîne fautive — donc la nouvelle adresse de sortie si
 * c'est la cause.
 */
export function resolveThrottlerTracker(request: { headers?: Record<string, unknown>; ip?: string }): string {
  const forwardedFor = request.headers?.['x-forwarded-for'] as string | string[] | undefined
  const clientIp = resolveClientIp(forwardedFor)

  if (clientIp) {
    return clientIp
  }

  if (forwardedFor && Date.now() - lastUnresolvedLogAt > UNRESOLVED_LOG_INTERVAL_MS) {
    lastUnresolvedLogAt = Date.now()
    logger.warn(
      `Adresse du visiteur non résolue : x-forwarded-for="${String(forwardedFor).slice(0, 200)}". ` +
        `Intermédiaires déclarés : ${TRUSTED_PROXIES.join(', ')}. ` +
        `Vérifier \`dig +short egress.osc-fr1.scalingo.com\` et la variable TRUSTED_PROXY_IPS.`,
    )
  }

  return request.ip ?? 'unknown'
}

/** Entrées de `TRUSTED_PROXIES` qu'aucun des deux limiteurs ne saurait interpréter. Doit rester vide. */
export function invalidTrustedProxies(): string[] {
  return TRUSTED_PROXIES.filter((entry) => {
    const [address, prefixPart] = entry.split('/')
    if (!toIpv4Bytes(address)) {
      return true
    }
    return prefixPart !== undefined && !(/^\d{1,2}$/.test(prefixPart) && Number(prefixPart) <= 32)
  })
}
