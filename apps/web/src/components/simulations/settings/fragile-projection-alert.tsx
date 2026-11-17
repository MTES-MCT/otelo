'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
import { FC } from 'react'
import { useEpcis } from '~/hooks/use-epcis'

/**
 * Avertit, au moment du choix de scénario, que la projection de certains EPCI n'est pas robuste.
 *
 * Nommer les EPCI concernés évite de jeter le doute sur tout le bassin : seuls eux ont une
 * projection recalculée par ventilation des projections départementales.
 */
export const FragileProjectionAlert: FC<{ epciCodes: string[]; epcisCount: number }> = ({ epciCodes, epcisCount }) => {
  const { data: epcis } = useEpcis(epciCodes.length > 0 ? epciCodes : undefined)

  if (epciCodes.length === 0) return null

  const names = epciCodes.map((code) => epcis?.find((epci) => epci?.code === code)?.name ?? code)
  const subject =
    epcisCount === 1 ? 'ce territoire' : names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`

  return (
    <Alert
      severity="warning"
      small
      description={
        <>
          Pour {subject}, l&apos;Insee ne propose pas de projection démographique robuste. Les projections affichées ont été recalculées en
          ventilant les projections départementales — ménages ou population — au prorata du poids de l&apos;EPCI dans le département. Si
          vous disposez de votre propre projection, vous pouvez créer un scénario personnalisé.{' '}
          <a href="/guide#ventilation-projections" target="_blank" rel="noopener noreferrer" title="En savoir plus - nouvelle fenêtre">
            En savoir plus
          </a>
        </>
      }
    />
  )
}
