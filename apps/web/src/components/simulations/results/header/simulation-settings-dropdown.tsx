'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { Tag } from '@codegouvfr/react-dsfr/Tag'
import { TEpci } from '@shared'
import { useState } from 'react'
import { ShareSimulationModal } from '~/components/collaboration/share-simulation-modal'
import { useSession } from '~/lib/auth/client'
import { TSimulationWithResults } from '~/schemas/simulation'
import { formatDecohabitation, formatScenario } from '~/utils/omphale-label'
import styles from './simulation-settings-dropdown.module.css'

export const SimulationSettingsDropdown = ({ simulation, epci }: { simulation: TSimulationWithResults; epci?: TEpci }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const { data: session } = useSession()
  const isOwner = session?.user?.id === simulation.userId

  const categories = [
    {
      title: 'Projection démographique',
      tags: [
        {
          iconId: 'ri-group-line' as const,
          text: `Population : ${formatScenario(simulation.scenario.b2_scenario.split('_')[0], true)}`,
        },
        {
          iconId: 'ri-home-4-line' as const,
          text: `Décohabitation : ${formatDecohabitation(simulation.scenario.b2_scenario.split('_')[1], true)}`,
        },
      ],
      link: `/simulation/${simulation.id}/modifier/parametrages-demographique`,
    },
    ...(epci
      ? [
          {
            title: 'Logements vacants longue durée',
            tags: [
              {
                iconId: 'ri-checkbox-circle-line' as const,
                text: `Taux cible : ${(Number(simulation.scenario.epciScenarios.find((e) => e.epciCode === epci.code)?.b2_tx_vacance_longue) * 100).toFixed(2)}%`,
              },
            ],
            link: `/simulation/${simulation.id}/modifier/taux-cibles-logements-vacants`,
          },
        ]
      : []),
    ...(epci
      ? [
          {
            title: 'Résidences secondaires',
            tags: [
              {
                iconId: 'ri-checkbox-circle-line' as const,
                text: `Taux cible : ${(Number(simulation.scenario.epciScenarios.find((e) => e.epciCode === epci.code)?.b2_tx_rs) * 100).toFixed(2)}%`,
              },
            ],
            link: `/simulation/${simulation.id}/modifier/taux-cibles-residences-secondaires`,
          },
        ]
      : []),
    ...(epci
      ? [
          {
            title: 'Renouvellement urbain',
            tags: [
              {
                iconId: 'ri-link' as const,
                text: `Restructuration : ${(Number(simulation.scenario.epciScenarios.find((e) => e.epciCode === epci.code)?.b2_tx_restructuration) * 100).toFixed(2)}%`,
              },
              {
                iconId: 'ri-link-unlink' as const,
                text: `Disparition : ${(Number(simulation.scenario.epciScenarios.find((e) => e.epciCode === epci.code)?.b2_tx_disparition) * 100).toFixed(2)}%`,
              },
            ],
            link: `/simulation/${simulation.id}/modifier/taux-restructuration-disparition`,
          },
        ]
      : []),
  ]

  return (
    <>
      <div className="fr-flex fr-direction-column fr-flex-gap-4v">
        <div className="fr-flex fr-flex-gap-2v">
          <Button
            priority="tertiary no outline"
            iconPosition="right"
            iconId={showDropdown ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
            onClick={() => setShowDropdown(!showDropdown)}
            size="small"
          >
            Paramétrage
          </Button>
          <Button priority="secondary" size="small" linkProps={{ href: `/simulation/${simulation.id}/modifier/cadrage-temporel` }}>
            Modifier
          </Button>
          {isOwner && <ShareSimulationModal simulationId={simulation.id} simulationName={simulation.name ?? 'Simulation'} />}
        </div>
        {showDropdown && (
          <div className={styles.dropdown}>
            {categories.map((category, index) => (
              <div key={index} className={styles.column}>
                <span className="fr-text--medium fr-text--sm fr-mb-1w">{category.title}</span>
                <div className="fr-flex fr-direction-column">
                  {category.tags.map((tag, tagIndex) => (
                    <Tag
                      key={tagIndex}
                      iconId={tag.iconId}
                      className="fr-mt-1w"
                      linkProps={{
                        href: category.link,
                      }}
                    >
                      {tag.text}
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
