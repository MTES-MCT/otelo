'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
import Input from '@codegouvfr/react-dsfr/Input'
import Pagination from '@codegouvfr/react-dsfr/Pagination'
import { SIMULATION_CHANGE_ACTION_LABELS, SIMULATION_CHANGE_ACTIONS } from '@shared'
import classNames from 'classnames'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useDebounce } from 'use-debounce'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { ChangeEntry } from '~/components/admin/changes/change-entry'
import { ADMIN_CARD, ADMIN_CARD_HEADER, ADMIN_CHIP, ADMIN_FILTER_CHIPS } from '~/components/admin/shared/admin-classes'
import { AdminPageHeader } from '~/components/admin/shared/admin-page-header'
import { ExportCsvButton } from '~/components/admin/shared/export-csv-button'
import { PeriodSelector, usePeriodRange } from '~/components/admin/shared/period-selector'
import { useSimulationChanges } from '~/hooks/use-simulation-changes'

const MIN_SEARCH_LENGTH = 2

export default function JournalPage() {
  const { range } = usePeriodRange()
  const [filters, setFilters] = useQueryStates({
    action: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    search: parseAsString.withDefault(''),
  })
  const [debouncedSearch] = useDebounce(filters.search, 300)

  const { data, error, isLoading } = useSimulationChanges(range, {
    action: filters.action || undefined,
    page: filters.page,
    search: debouncedSearch.length >= MIN_SEARCH_LENGTH ? debouncedSearch : undefined,
  })

  return (
    <>
      <AdminPageHeader
        actions={<ExportCsvButton dataset="changements" />}
        icon="fr-icon-article-line"
        subtitle="Qui a modifié quoi, et quand : chaque paramètre de scénario avec sa valeur avant et après."
        title="Journal des modifications"
      />

      <PeriodSelector />

      <div className={classNames(ADMIN_CARD, 'fr-mb-3w')}>
        <div className="fr-p-2w">
          <div className={ADMIN_FILTER_CHIPS}>
            <button
              className={classNames(ADMIN_CHIP, filters.action === '' ? styles.chipActive : styles.chip)}
              onClick={() => setFilters({ action: '', page: 1 })}
              type="button"
            >
              Toutes les actions
            </button>
            {SIMULATION_CHANGE_ACTIONS.map((action) => (
              <button
                className={classNames(ADMIN_CHIP, filters.action === action ? styles.chipActive : styles.chip)}
                key={action}
                onClick={() => setFilters({ action, page: 1 })}
                type="button"
              >
                {SIMULATION_CHANGE_ACTION_LABELS[action]}
              </button>
            ))}
          </div>
          <Input
            className="fr-mt-2w fr-mb-0"
            label="Rechercher"
            nativeInputProps={{
              onChange: (event) => setFilters({ page: 1, search: event.target.value }),
              placeholder: 'Nom de scénario ou auteur…',
              value: filters.search,
            }}
          />
        </div>
      </div>

      {error && <Alert className="fr-mb-3w" description="Erreur lors du chargement du journal" severity="error" small />}

      <div className={ADMIN_CARD}>
        <div className={ADMIN_CARD_HEADER}>
          <h2 className={classNames('fr-m-0', styles.cardTitle)}>
            {data ? `${data.total.toLocaleString('fr-FR')} modification${data.total > 1 ? 's' : ''}` : 'Modifications'}
          </h2>
        </div>

        {isLoading ? (
          <p className="fr-p-3w fr-text--sm fr-text-mention--grey fr-mb-0">Chargement…</p>
        ) : !data?.items.length ? (
          <p className="fr-p-3w fr-text--sm fr-text-mention--grey fr-mb-0">
            Aucune modification sur cette période. Le journal ne remonte pas avant sa mise en service : les scénarios modifiés auparavant
            n'y figurent pas.
          </p>
        ) : (
          <ul className="fr-m-0 fr-p-0">
            {data.items.map((change) => (
              <ChangeEntry change={change} key={change.id} />
            ))}
          </ul>
        )}
      </div>

      {data && data.pageCount > 1 && (
        <Pagination
          className="fr-flex fr-justify-content-center fr-mt-3w"
          count={data.pageCount}
          defaultPage={filters.page}
          getPageLinkProps={(pageNumber) => ({
            href: '#',
            onClick: (event) => {
              event.preventDefault()
              setFilters({ page: pageNumber })
            },
          })}
        />
      )}
    </>
  )
}
