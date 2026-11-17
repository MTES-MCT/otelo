'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { TEpci } from '@otelo/shared'
import { useContiguousEpcis } from '~/hooks/use-contiguous-epcis'
import { CheckboxEpcis } from './checkbox-epcis'

type ContiguousEpcisCheckboxesProps = {
  epcis: TEpci[]
}

export const ContiguousEpcisCheckboxes = ({ epcis }: ContiguousEpcisCheckboxesProps) => {
  const epciCodes = epcis.map(({ code }) => code)
  const { data: contiguousEpcis, isLoading } = useContiguousEpcis(epciCodes)

  if (isLoading) {
    return (
      <div className={fr.cx('fr-pb-4w')}>
        <p>Chargement des EPCI limitrophes...</p>
      </div>
    )
  }

  if (!epcis) {
    return null
  }
  const filteredContiguousEpcis = contiguousEpcis.filter((contiguousEpci) => !epciCodes.includes(contiguousEpci.code))

  if (!filteredContiguousEpcis || filteredContiguousEpcis.length === 0) {
    return (
      <div className={fr.cx('fr-pb-4w')}>
        <p className={fr.cx('fr-text--sm')}>Aucun EPCI limitrophe trouvé.</p>
      </div>
    )
  }

  return (
    <div className={fr.cx('fr-pb-4w')}>
      <CheckboxEpcis
        epcis={filteredContiguousEpcis}
        legend="Vous pouvez sélectionner des EPCI limitrophes à inclure dans votre simulation :"
      />
    </div>
  )
}
