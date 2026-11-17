'use client'

import Tooltip from '@codegouvfr/react-dsfr/Tooltip'
import { FC } from 'react'
import type { Definition } from '~/components/simulations/tutorial/definitions'

/**
 * Bouton « ? » qui affiche une définition au clic, à placer juste après le libellé qu'il éclaire.
 *
 * Contrairement aux bulles du guide, la définition est permanente : elle reste accessible
 * que le guide de prise en main ait été lancé ou non.
 */
export const DefinitionTooltip: FC<{ definition: Definition }> = ({ definition }) => (
  <Tooltip
    kind="click"
    title={
      // Le DSFR rend le contenu dans un `<span role="tooltip">` : pas de balise de bloc ici.
      <>
        <strong className="fr-display-block fr-mb-1v">{definition.title}</strong>
        {definition.description}
      </>
    }
  />
)
