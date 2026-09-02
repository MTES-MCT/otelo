import { Prisma } from '~/generated/prisma/client'
import { Role } from '~/generated/prisma/enums'

/**
 * Exclusion de l'équipe des statistiques d'usage.
 *
 * Les comptes `ADMIN` sont ceux de l'équipe Otelo. Ils créent des scénarios pour
 * éprouver le produit, se connectent plusieurs fois par jour et exportent en boucle :
 * laissés dans les chiffres, ils gonflent l'usage mesuré sans qu'aucune collectivité
 * n'ait rien fait, et ils le gonflent d'autant plus que le produit est jeune.
 *
 * Trois filtres pour une seule règle, parce que les requêtes ont trois formes. Passer
 * par ce fichier plutôt que par une condition écrite sur place n'est pas un confort :
 * une statistique où l'exclusion a été oubliée ne produit aucune erreur, juste un
 * chiffre trop haut que personne ne peut recouper.
 *
 * Ce qui reste volontairement compté : les lignes sans propriétaire. Une simulation
 * peut appartenir à un consommateur d'API (`api_consumer_id`) plutôt qu'à un
 * utilisateur ; c'est un usage réel, et l'écarter au passage fausserait dans l'autre
 * sens. D'où `NOT EXISTS` plutôt que `NOT IN`, et `NOT` plutôt qu'une égalité : les
 * deux gardent les lignes dont l'utilisateur est nul.
 */

/** Filtre Prisma sur le modèle `user` lui-même. */
export const IS_ROLE_USER = { role: Role.USER } as const

/** Filtre Prisma sur un modèle qui porte une relation `user` facultative. */
export const OWNER_IS_NOT_TEAM = { NOT: { user: { role: Role.ADMIN } } } as const

/**
 * Condition SQL sur une colonne portant un identifiant d'utilisateur.
 *
 * `column` est un nom de colonne écrit dans le code, jamais une donnée reçue : il est
 * interpolé tel quel, ce que `Prisma.raw` autorise et que le reste du fichier interdit.
 */
export const ownerIsNotTeam = (column: string): Prisma.Sql =>
  Prisma.sql`NOT EXISTS (SELECT 1 FROM users otelo_team WHERE otelo_team.id = ${Prisma.raw(column)} AND otelo_team.role = 'ADMIN')`
