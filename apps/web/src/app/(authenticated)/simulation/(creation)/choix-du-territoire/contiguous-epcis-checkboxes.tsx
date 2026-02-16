'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { TEpci } from '@shared'
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
      <div className={fr.cx('fr-py-4w')}>
        <p>Chargement des EPCIs limitrophes...</p>
      </div>
    )
  }

  if (!epcis) {
    return null
  }
  const filteredContiguousEpcis = contiguousEpcis.filter((contiguousEpci) => !epciCodes.includes(contiguousEpci.code))

  if (!filteredContiguousEpcis || filteredContiguousEpcis.length === 0) {
    return (
      <div className={fr.cx('fr-py-4w')}>
        <p className={fr.cx('fr-text--sm')}>Aucun EPCI limitrophe trouvé.</p>
      </div>
    )
  }

  return (
    <div className={fr.cx('fr-py-4w')}>
      <h4 className={fr.cx('fr-mb-2w')}>EPCIs limitrophes</h4>
      <p className={fr.cx('fr-text--sm', 'fr-mb-2w')}>Vous pouvez sélectionner des EPCIs limitrophes à inclure dans votre simulation :</p>
      <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
        <div className={fr.cx('fr-col-12', 'fr-col-md-12')}>
          <CheckboxEpcis epcis={filteredContiguousEpcis} legend="Sélection des EPCIs" />
        </div>
      </div>
    </div>
  )
}
