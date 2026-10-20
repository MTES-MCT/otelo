'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
import { FC } from 'react'

interface PeakYearHorizonAlertProps {
  peakYear: number | null
  projection: number | null
  millesime?: number | null
}

export const PeakYearHorizonAlert: FC<PeakYearHorizonAlertProps> = ({ peakYear, projection, millesime }) => {
  if (!peakYear || !projection || peakYear >= projection) return null

  const isLockedByMillesime = millesime !== undefined && millesime !== null && peakYear <= millesime

  return (
    <div className="fr-py-2w fr-pt-2w">
      <Alert
        severity="info"
        small
        description={
          isLockedByMillesime ? (
            <>
              <p className="fr-mb-1w">
                L&apos;évolution démographique retenue prévoit que le nombre de ménages est maximal dès l&apos;année de départ, en{' '}
                <strong>{millesime}</strong>. Le territoire est donc déjà dans une phase de baisse du nombre de ménages.
              </p>
              <p className="fr-mb-1w">
                Dans ce contexte, la diminution du nombre de résidences principales entraîne mécaniquement une évolution de la vacance et
                des résidences secondaires. Il n&apos;est donc pas pertinent de définir des taux cibles de vacance ou de résidences
                secondaires à un horizon futur.
              </p>
            </>
          ) : (
            <>
              <p className="fr-mb-1w">
                L&apos;évolution démographique retenue prévoit que le nombre de ménages atteint un maximum en <strong>{peakYear}</strong>,
                avant l&apos;horizon de projection choisi ({projection}).
              </p>
              <p className="fr-mb-1w">
                Après l&apos;année du pic de ménages, la baisse du nombre de ménages entraîne mécaniquement une diminution du nombre de
                résidences principales, en volume comme en part du parc. Cela impacte l&apos;évolution de la vacance et des résidences
                secondaires selon une logique très différente de ce qui se passe pendant la période de croissance démographique&nbsp;: il
                n&apos;y a par exemple pas d&apos;enjeu de remobilisation des logements vacants à des fins de résidence principale si le
                nombre de ces dernières décroît.
              </p>
              <p className="fr-mb-0">
                Pour cette raison, les taux cibles définis pour la vacance et les résidences secondaires sont ramenés à{' '}
                <strong>{peakYear}</strong>, année du pic de ménages.
              </p>
            </>
          )
        }
      />
    </div>
  )
}
