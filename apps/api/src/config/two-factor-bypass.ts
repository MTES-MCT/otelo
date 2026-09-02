import { env } from '~/config/env'

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
 */
export const TWO_FACTOR_BYPASS_EMAILS: string[] = env.TWO_FACTOR_BYPASS_EMAILS.split(',')
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean)

export function isTwoFactorBypassed(email: string): boolean {
  if (TWO_FACTOR_BYPASS_EMAILS.length === 0) {
    return false
  }

  const normalized = email.trim().toLowerCase()

  return TWO_FACTOR_BYPASS_EMAILS.some((entry) => (entry.startsWith('@') ? normalized.endsWith(entry) : normalized === entry))
}
