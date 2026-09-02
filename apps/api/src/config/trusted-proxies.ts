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

/**
 * Adresse exacte portée par une entrée de la liste, ou `null` si l'entrée est illisible.
 *
 * Le suffixe `/32` est toléré : `.env.example` a publié les adresses sous cette forme,
 * elles sont donc renseignées telles quelles sur les environnements déployés. Les
 * refuser viderait la liste au redémarrage suivant, et tous les visiteurs partageraient
 * alors le compteur de l'intermédiaire, sans le moindre signal. Toute autre longueur de
 * préfixe est en revanche refusée : une plage n'a pas de sens pour des adresses de
 * sortie fixes, et la traiter comme une adresse exacte ferait taire une entrée qui ne
 * protège personne.
 */
const toTrustedAddress = (entry: string): string | null => {
  const address = entry.endsWith('/32') ? entry.slice(0, -3) : entry

  return isIpv4(address) ? address : null
}

const TRUSTED_PROXY_ADDRESSES = new Set(TRUSTED_PROXIES.map(toTrustedAddress).filter((address) => address !== null))

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

    if (TRUSTED_PROXY_ADDRESSES.has(address)) {
      continue
    }

    // Une IPv6 est retenue telle quelle ; toute autre forme est illisible.
    return isIpv4(address) || address.includes(':') ? address : null
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
        `Vérifier la variable TRUSTED_PROXY_IPS.`,
    )
  }

  return request.ip ?? 'unknown'
}

/** Entrées de `TRUSTED_PROXIES` que ce module ne sait pas lire. Doit rester vide. */
export function invalidTrustedProxies(): string[] {
  return TRUSTED_PROXIES.filter((entry) => toTrustedAddress(entry) === null)
}
