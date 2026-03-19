import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import type { Metadata } from 'next'
import { DashboardSimulationItem } from '~/components/tableau-de-bord/dashboard-simulation-item'
import { getDashboardList } from '~/server-only/simulation/get-dashboard-list'
import { NoResults } from './no-results'
import styles from './tableaux-de-bord.module.css'

export const metadata: Metadata = {
  title: 'Vos études Otelo',
}

export default async function TableauDeBordPage() {
  const dashboardGroups = await getDashboardList()

  if (dashboardGroups.length === 0) {
    return <NoResults />
  }

  // Separate own groups (at least one non-shared simulation) from fully-shared groups
  const ownGroups = dashboardGroups.filter((group) => group.simulations.some((s) => !s.isShared))
  const sharedGroups = dashboardGroups
    .map((group) => ({
      ...group,
      simulations: group.simulations.filter((s) => s.isShared),
    }))
    .filter((group) => group.simulations.length > 0)

  return (
    <div className="fr-container fr-py-2w">
      {ownGroups.length > 0 && (
        <>
          <h1>Vos études</h1>
          <div className="fr-flex fr-direction-column fr-flex-gap-16v">
            {ownGroups.map((group) => {
              const ownSimulations = group.simulations.filter((s) => !s.isShared)
              return (
                <div key={group.id} className="fr-flex fr-direction-column fr-flex-gap-8v">
                  <div className="fr-flex fr-justify-content-space-between fr-align-items-center">
                    <div className="fr-width-full">
                      <h2 className={classNames(styles.title, 'fr-mb-0 fr-h4')}>
                        <span className="ri-folder-open-line fr-mr-1w" />
                        {group.name}
                      </h2>
                      <div style={{ width: '80%' }}>
                        {group.epcis.map((epci, index) => (
                          <span key={epci.code} className="fr-text-mention--grey fr-text--sm fr-mb-0" style={{ display: 'inline-block' }}>
                            {epci.name}
                            {index < group.epcis.length - 1 ? ', ' : ''}&nbsp;
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Button linkProps={{ href: `/tableau-de-bord/${group.id}` }} priority="secondary" className="fr-text--nowrap">
                        Créer une présentation des scénarios
                      </Button>
                    </div>
                  </div>
                  <div>
                    <div className={styles.grid}>
                      {ownSimulations.map((simulation) => (
                        <div className={classNames(styles.item, 'fr-background-default--grey fr-p-5v shadow')} key={simulation.id}>
                          <DashboardSimulationItem key={simulation.id} simulation={simulation} />
                        </div>
                      ))}
                      {Array.from({ length: 3 - (ownSimulations.length % 3) || 3 }, (_, index) => {
                        const isFirstPlaceholder = index === 0
                        return (
                          <div
                            key={`placeholder-${index}`}
                            className={classNames(
                              styles.item,
                              'fr-background-contrast--blue-france fr-flex fr-align-items-center fr-justify-content-center',
                            )}
                          >
                            {isFirstPlaceholder && (
                              <Button
                                priority="tertiary no outline"
                                linkProps={{
                                  href: `/simulation/parametrages-demographique?epciGroupId=${group.id}&epcis=${group.epcis.map((epci) => epci.code).join(',')}&projection=${ownSimulations[0].scenario.projection}`,
                                }}
                              >
                                Ajouter un scénario +
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {sharedGroups.length > 0 && (
        <>
          <h1 className={ownGroups.length > 0 ? 'fr-mt-6w' : ''}>Études partagées avec vous</h1>
          <div className="fr-flex fr-direction-column fr-flex-gap-16v">
            {sharedGroups.map((group) => (
              <div key={`shared-${group.id}`} className="fr-flex fr-direction-column fr-flex-gap-8v">
                <div>
                  <h2 className={classNames(styles.title, 'fr-mb-0 fr-h4')}>
                    <span className="ri-share-line fr-mr-1w" />
                    {group.name}
                  </h2>
                  <div style={{ width: '80%' }}>
                    {group.epcis.map((epci, index) => (
                      <span key={epci.code} className="fr-text-mention--grey fr-text--sm fr-mb-0" style={{ display: 'inline-block' }}>
                        {epci.name}
                        {index < group.epcis.length - 1 ? ', ' : ''}&nbsp;
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className={styles.grid}>
                    {group.simulations.map((simulation) => (
                      <div className={classNames(styles.item, 'fr-background-default--grey fr-p-5v shadow')} key={simulation.id}>
                        <DashboardSimulationItem key={simulation.id} simulation={simulation} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
