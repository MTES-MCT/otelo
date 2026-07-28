'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { parseAsString, useQueryStates } from 'nuqs'

/**
 * Rappel non éditable du millésime : il se choisit à l'étape de cadrage temporel,
 * où l'on voit son effet sur l'année de départ de l'horizon.
 */
export const MillesimeReminder = () => {
  const [{ millesime, projection }] = useQueryStates({
    millesime: parseAsString,
    projection: parseAsString,
  })
  const searchParams = useSearchParams()
  const pathname = usePathname()

  if (!millesime) return null

  // Hors parcours de création (modification d'une simulation existante), le millésime est figé
  const isCreation = !pathname.includes('/modifier/')
  const searchParamsString = new URLSearchParams(searchParams).toString()
  const href = `/simulation/cadrage-temporel${searchParamsString ? `?${searchParamsString}` : ''}`

  return (
    <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
      <span aria-hidden="true" className="fr-icon-information-line fr-icon--sm fr-mr-1v" />
      Projections calculées à partir des données du millésime <strong>{millesime}</strong>
      {projection ? `, du 1er janvier ${millesime} au 1er janvier ${projection}` : ''}.{' '}
      {isCreation && (
        // Exclu des exports PNG : un lien n'a pas de sens dans une image
        <span data-chart-download-exclude>
          <Link href={href} className="fr-link fr-text--sm">
            Modifier le millésime
          </Link>
        </span>
      )}
    </p>
  )
}
