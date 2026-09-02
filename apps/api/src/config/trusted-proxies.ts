import { Logger } from '@nestjs/common'
import { z } from 'zod'
import { env } from '~/config/env'

/**
 * Adresses des intermédiaires réseau autorisés à annoncer l'adresse du visiteur.
 */
export const TRUSTED_PROXIES: string[] = env.TRUSTED_PROXY_IPS.split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)

// `::ffff:88.10.10.10` et `88.10.10.10` désignent la même machine — Node annonce l'une
// ou l'autre selon la pile réseau — et les distinguer ferait deux compteurs pour un seul
// visiteur.
const IPV4_MAPPED = /^::ffff:/i
const unwrapIpv4 = (value: string): string => (IPV4_MAPPED.test(value) ? value.slice(7) : value)

const ZIpv4 = z.ipv4()
const isIpv4 = (value: string): boolean => ZIpv4.safeParse(value).success
const toIpv4Bytes = (value: string): number[] | null => (isIpv4(value) ? value.split('.').map(Number) : null)

type Cidr = { bytes: number[]; prefix: number }

/**
 * Entrée de la liste, lue comme une adresse et une longueur de préfixe.
 *
 * Les plages sont acceptées, et elles sont nécessaires : le routeur d'entrée de la
 * plateforme se présente depuis un réseau interne dont l'adresse change d'un conteneur
 * à l'autre (`10.0.0.93`, `10.0.0.228`…). Une adresse exacte y serait juste le temps
 * d'un déploiement, puis fausse en silence.
 *
 * Sans longueur de préfixe, l'entrée désigne une adresse exacte — `/32`. C'est la
 * lecture que fait better-auth, qui reçoit cette liste telle quelle : les deux limiteurs
 * doivent interpréter la variable à l'identique, sans quoi un même visiteur se verrait
 * attribuer deux identités selon la route.
 */
const parseCidr = (entry: string): Cidr | null => {
  const parts = entry.split('/')

  if (parts.length > 2) {
    return null
  }

  const bytes = toIpv4Bytes(parts[0])

  if (!bytes) {
    return null
  }

  if (parts.length === 1) {
    return { bytes, prefix: 32 }
  }

  const prefix = /^\d{1,2}$/.test(parts[1]) ? Number(parts[1]) : Number.NaN

  return prefix >= 0 && prefix <= 32 ? { bytes, prefix } : null
}

const matchesCidr = (bytes: number[], cidr: Cidr): boolean => {
  let remaining = cidr.prefix

  for (let index = 0; index < 4 && remaining > 0; index++) {
    const mask = remaining >= 8 ? 0xff : (0xff << (8 - remaining)) & 0xff

    if ((bytes[index] & mask) !== (cidr.bytes[index] & mask)) {
      return false
    }

    remaining -= 8
  }

  return true
}

const TRUSTED_PROXY_CIDRS = TRUSTED_PROXIES.map(parseCidr).filter((cidr) => cidr !== null)

const isTrustedHop = (address: string): boolean => {
  const bytes = toIpv4Bytes(address)

  return bytes !== null && TRUSTED_PROXY_CIDRS.some((cidr) => matchesCidr(bytes, cidr))
}

/**
 * Réseaux privés (RFC 1918), boucle locale et lien-local.
 *
 * Une adresse de visiteur prise dans l'un d'eux ne vient pas d'Internet : c'est le
 * routeur de la plateforme qui a été retenu, faute d'être déclaré. Le compteur devient
 * alors commun à tous les visiteurs, et c'est la seule défaillance de ce module qui ne
 * produise ni erreur ni chaîne non résolue — d'où le contrôle explicite plus bas.
 */
const PRIVATE_RANGES = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '127.0.0.0/8', '169.254.0.0/16']
  .map(parseCidr)
  .filter((cidr) => cidr !== null)

const isPrivateAddress = (address: string): boolean => {
  const bytes = toIpv4Bytes(address)

  return bytes !== null && PRIVATE_RANGES.some((cidr) => matchesCidr(bytes, cidr))
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
    const address = unwrapIpv4(chain[index])

    if (isTrustedHop(address)) {
      continue
    }

    // Une IPv6 est retenue telle quelle ; toute autre forme est illisible.
    return isIpv4(address) || address.includes(':') ? address : null
  }

  return null
}

const logger = new Logger('ClientIp')
const MISCONFIGURATION_LOG_INTERVAL_MS = 300_000
let lastMisconfigurationLogAt = 0

const warnThrottled = (message: string): void => {
  if (Date.now() - lastMisconfigurationLogAt <= MISCONFIGURATION_LOG_INTERVAL_MS) {
    return
  }

  lastMisconfigurationLogAt = Date.now()
  logger.warn(`${message} Intermédiaires déclarés : ${TRUSTED_PROXIES.join(', ') || '(aucun)'}. Vérifier TRUSTED_PROXY_IPS.`)
}

/**
 * Identifiant de comptage du limiteur de débit NestJS.
 *
 * On lit l'en-tête plutôt que `req.ip` — donc sans dépendre du réglage `trust proxy`
 * d'Express. Ce réglage suppose de connaître l'adresse depuis laquelle le routeur de la
 * plateforme ouvre la connexion, une adresse interne et non documentée : s'y fier
 * ferait retomber tous les visiteurs sur un compteur commun le jour où cet adressage
 * change, et **sans aucun signal**.
 *
 * Deux anomalies sont signalées, toutes deux ramenées à une même cause — une liste
 * d'intermédiaires fausse — et toutes deux limitées à un message par tranche de cinq
 * minutes, pour rester lisibles dans un journal de plateforme :
 *
 *   - la chaîne ne se résout pas : repli sur `req.ip`, comportement antérieur conservé
 *     plutôt que de bloquer ;
 *   - la chaîne se résout sur une adresse privée : ce n'est pas un visiteur, c'est
 *     l'intermédiaire lui-même, retenu faute d'être déclaré. Rien d'autre ne le
 *     signalerait, et le plafond de débit devient alors commun à tout le trafic.
 */
export function resolveThrottlerTracker(request: { headers?: Record<string, unknown>; ip?: string }): string {
  const forwardedFor = request.headers?.['x-forwarded-for'] as string | string[] | undefined
  const clientIp = resolveClientIp(forwardedFor)

  if (clientIp) {
    if (isPrivateAddress(clientIp)) {
      warnThrottled(`Adresse de visiteur privée : "${clientIp}", issue de x-forwarded-for="${String(forwardedFor).slice(0, 200)}".`)
    }

    return clientIp
  }

  if (forwardedFor) {
    warnThrottled(`Adresse du visiteur non résolue : x-forwarded-for="${String(forwardedFor).slice(0, 200)}".`)
  }

  return request.ip ?? 'unknown'
}

/** Entrées de `TRUSTED_PROXIES` que ce module ne sait pas lire. Doit rester vide. */
export function invalidTrustedProxies(): string[] {
  return TRUSTED_PROXIES.filter((entry) => parseCidr(entry) === null)
}
