'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
import { FC } from 'react'

interface PeakYearHorizonAlertProps {
  peakYear: number | null
  projection: number | null
}

export const PeakYearHorizonAlert: FC<PeakYearHorizonAlertProps> = ({ peakYear, projection }) => {
  if (!peakYear || !projection || peakYear >= projection) return null

  return (
    <div className="fr-py-2w fr-pt-2w">
      <Alert
        severity="info"
        small
        description={
          <>
            <p className="fr-mb-1w">
              L&apos;évolution démographique retenue prévoit que le nombre de ménages atteint un maximum en <strong>{peakYear}</strong>,
              avant l&apos;horizon de projection choisi ({projection}).
            </p>
            <p className="fr-mb-1w">
              Après l&apos;année du pic de ménages, la baisse du nombre de ménages entraîne mécaniquement une baisse des résidences
              principales, en volume, comme en part du parc, ce qui influence les parts de logements vacants et/ou résidences secondaires.
            </p>
            <p className="fr-mb-0">
              C&apos;est pourquoi les cibles d&apos;évolution du parc sont à renseigner jusqu&apos;en <strong>{peakYear}</strong>, année du
              pic de ménages. Les résultats seront ensuite projetés jusqu&apos;à l&apos;horizon de projection ({projection}).
            </p>
          </>
        }
      />
    </div>
  )
}
