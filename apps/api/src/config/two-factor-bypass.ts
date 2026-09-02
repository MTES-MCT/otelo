import { Logger } from '@nestjs/common'

/**
 * Comptes dispensés de la seconde authentification.
 *
 * Destiné aux comptes de test et de démonstration : un scénario automatisé ne peut pas
 * relever une boîte mail, et un compte de démonstration partagé n'a pas de destinataire
 * unique à qui envoyer un code.
 *
 * `TWO_FACTOR_BYPASS_EMAILS` accepte, séparés par des virgules :
 *   - une adresse exacte      → `demo@otelo.test`
 *   - un domaine entier       → `@e2e.otelo.test`
 *
 * Ce que la dispense fait, et ne fait pas : elle retire la **seconde** étape, pas la
 * première. Le mot de passe reste exigé, ainsi que la validation d'accès. Un compte
 * dispensé est donc protégé comme il l'était avant l'introduction de la double
 * authentification — pas moins, mais pas plus.
 *
 * Conséquence à peser avant d'y inscrire un domaine : toute personne capable de créer
 * une adresse dans ce domaine obtient un compte à un seul facteur. N'y mettre que des
 * domaines dont vous maîtrisez la création, idéalement non routables (`.test`, `.local`).
 * Ne jamais y inscrire un domaine de messagerie réel.
 */
const logger = new Logger('TwoFactorBypass')

export const TWO_FACTOR_BYPASS_EMAILS: string[] = (process.env.TWO_FACTOR_BYPASS_EMAILS ?? '')
  .split(',')
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean)

/**
 * Indique si un compte est dispensé de la seconde étape.
 *
 * La comparaison est insensible à la casse : les adresses sont saisies par des humains,
 * et une dispense qui échoue sur une majuscule serait un piège à débogage.
 */
export function isTwoFactorBypassed(email: string): boolean {
  if (TWO_FACTOR_BYPASS_EMAILS.length === 0) {
    return false
  }

  const normalized = email.trim().toLowerCase()

  return TWO_FACTOR_BYPASS_EMAILS.some((entry) => (entry.startsWith('@') ? normalized.endsWith(entry) : normalized === entry))
}

/**
 * Signale au démarrage que des dispenses sont actives.
 *
 * Une dispense de second facteur ne doit jamais pouvoir traîner sans qu'on le sache :
 * la variable peut être copiée d'un environnement à l'autre, ou laissée en place après
 * une campagne de tests. Le journal de démarrage est le seul endroit où l'on est certain
 * que quelqu'un finira par la voir.
 */
export function logTwoFactorBypassConfiguration(): void {
  if (TWO_FACTOR_BYPASS_EMAILS.length === 0) {
    return
  }

  logger.warn(
    `Double authentification désactivée pour ${TWO_FACTOR_BYPASS_EMAILS.length} entrée(s) : ` +
      `${TWO_FACTOR_BYPASS_EMAILS.join(', ')}. ` +
      `Ces comptes se connectent avec leur seul mot de passe. À retirer de TWO_FACTOR_BYPASS_EMAILS hors campagne de test.`,
  )
}
