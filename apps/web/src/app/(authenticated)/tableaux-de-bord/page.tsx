import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import type { Metadata } from 'next'
import { PeriodRow } from '~/components/tableau-de-bord/period-row'
import { getDashboardList } from '~/server-only/simulation/get-dashboard-list'
import { groupByPeriod } from './group-by-period'
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

  return (
    <div className="fr-container fr-py-2w">
      <h1>Vos études Otelo</h1>
      <p>
        Construisez les scénarios de besoins en logements adaptés à vos documents d&apos;urbanisme grâce à notre méthodologie de référence,
        aux millions de données territoriales analysées automatiquement, à nos guides sur les enjeux de mal logement, sobriété foncière et
        vacance immobilière.
      </p>
      <Button
        iconId="ri-arrow-right-line"
        iconPosition="right"
        linkProps={{ href: '/simulation/choix-du-territoire' }}
        className="fr-mb-6w"
      >
        Élaborer un scénario
      </Button>

      <div className="fr-flex fr-direction-column fr-flex-gap-16v">
        {dashboardGroups.map((group) => {
          const periodGroups = groupByPeriod(group.simulations)

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

              <div className="fr-flex fr-direction-column fr-flex-gap-6v">
                {periodGroups.map((period) => (
                  <PeriodRow
                    key={period.periodKey}
                    millesime={period.millesime}
                    projection={period.projection}
                    simulations={period.simulations}
                    epciGroupId={group.id}
                    epcis={group.epcis}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
