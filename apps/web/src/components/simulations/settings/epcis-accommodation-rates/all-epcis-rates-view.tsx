'use client'

import Badge from '@codegouvfr/react-dsfr/Badge'
import { FC } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { CreateAllEpcisAccommodationRange } from '~/components/simulations/settings/create-all-epcis-accommodation-range'
import { AggregatedParcsComparisonChart } from './aggregated-parc-comparison-chart'

export const AllEpcisRatesView: FC = () => {
  const { defaultRates } = useEpcisRates()

  // Calculate aggregated long-term vacancy rate: Part_VLD × Taux_FILOCOM_BH
  const epciIds = Object.keys(defaultRates)
  const totalLongTermVacant = epciIds.reduce((sum, id) => sum + defaultRates[id].longTermVacantCount, 0)
  const totalVacant = epciIds.reduce((sum, id) => sum + defaultRates[id].totalVacantCount, 0)
  const partVacanceLongueDuree = totalVacant > 0 ? totalLongTermVacant / totalVacant : 0

  const totalParctot = epciIds.reduce((sum, id) => sum + defaultRates[id].parctot, 0)
  const tauxVacanceBH =
    totalParctot > 0 ? epciIds.reduce((sum, id) => sum + defaultRates[id].vacancyRate * defaultRates[id].parctot, 0) / totalParctot : 0

  const averageLongTermRate = partVacanceLongueDuree * tauxVacanceBH

  return (
    <div className="fr-p-4w shadow">
      <div className="fr-mb-2w">
        <div className="fr-flex fr-direction-column fr-flex-gap-8v">
          <div className="fr-flex fr-direction-column fr-flex-gap-2v">
            <span className="fr-text--medium">Vacance de longue durée</span>
            <p className="fr-mb-0">
              Elle désigne les logements vacants depuis plus de deux ans. Elle représente un réservoir de logements mobilisables. Le taux
              moyen en 2021 sur l'ensemble du territoire est de <strong>{(averageLongTermRate * 100).toFixed(2)}%</strong>.
            </p>
          </div>
          <CreateAllEpcisAccommodationRange />
          <div className="fr-flex fr-direction-column fr-flex-gap-2v">
            <div className="fr-flex fr-flex-gap-2v">
              <span className="fr-text--medium">Vacance de courte durée</span>
              <Badge>Non modifiable</Badge>
            </div>
            <p>
              Elle regroupe les logements temporairement vacants (rotation locative, mise en vente, travaux), nécessaires au bon
              fonctionnement du marché du logement. Otelo considère le taux de vacance courte durée observé en 2021 comme{' '}
              <span className="fr-text--bold">stable</span> et ne propose pas de le modifier.
            </p>
          </div>
        </div>
      </div>
      <div className="fr-flex fr-direction-column fr-flex-gap-6v fr-justify-content-space-between">
        <AggregatedParcsComparisonChart />
      </div>
    </div>
  )
}
