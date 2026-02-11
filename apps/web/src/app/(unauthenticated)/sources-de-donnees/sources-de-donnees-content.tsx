'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Accordion from '@codegouvfr/react-dsfr/Accordion'
import Alert from '@codegouvfr/react-dsfr/Alert'
import Badge from '@codegouvfr/react-dsfr/Badge'
import CallOut from '@codegouvfr/react-dsfr/CallOut'
import { Table } from '@codegouvfr/react-dsfr/Table'
import Tabs from '@codegouvfr/react-dsfr/Tabs'
import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs'
import { useEffect, useMemo, useRef } from 'react'
import {
  DATA_SOURCES,
  groupBySource,
  groupByStep,
  type SourceEntry,
  type SourceGroup,
  type StepGroup,
  UNIQUE_MILLESIMES,
  UNIQUE_SOURCES,
} from './data'
import styles from './sources-de-donnees.module.css'

const queryParams = {
  tab: parseAsStringEnum(['source', 'etape']).withDefault('source'),
  open: parseAsString,
  q: parseAsString.withDefault(''),
  source: parseAsString.withDefault(''),
  millesime: parseAsString.withDefault(''),
}

export function SourcesDeDonneesContent() {
  const [{ tab, open, q, source, millesime }, setQueryStates] = useQueryStates(queryParams)
  const scrolledRef = useRef(false)

  useEffect(() => {
    if (open && !scrolledRef.current) {
      scrolledRef.current = true
      setTimeout(() => {
        document.getElementById(open)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [open])

  const filteredEntries = useMemo(() => {
    const query = q.toLowerCase()
    return DATA_SOURCES.filter((e: SourceEntry) => {
      if (source && e.source !== source) return false
      if (millesime && e.millesime !== millesime) return false
      if (query) {
        const haystack = `${e.source} ${e.etape} ${e.description} ${e.millesime}`.toLowerCase()
        return haystack.includes(query)
      }
      return true
    })
  }, [q, source, millesime])

  const sourceGroups = useMemo(() => groupBySource(filteredEntries), [filteredEntries])
  const stepGroups = useMemo(() => groupByStep(filteredEntries), [filteredEntries])

  const hasResults = filteredEntries.length > 0

  return (
    <section className={fr.cx('fr-container')}>
      <h1 className={fr.cx('fr-mb-4w')}>Sources de données</h1>

      <CallOut title="Comprendre d'où viennent les chiffres" className={fr.cx('fr-mb-4w')}>
        Cette page liste les sources mobilisées, leur millésime, et leur utilisation dans les étapes du parcours. Vous pouvez rechercher et
        filtrer par producteur/source, millésime et mots-clés.
      </CallOut>

      <div className={styles.filtersRow}>
        <div className={styles.searchBar}>
          <div className="fr-search-bar" role="search">
            <label className="fr-label" htmlFor="datasource-search">
              Rechercher
            </label>
            <input
              className="fr-input"
              placeholder="Ex : vacance, INSEE, hébergement..."
              type="search"
              id="datasource-search"
              value={q}
              onChange={(e) => setQueryStates({ q: e.target.value || null })}
            />
            <button className="fr-btn" title="Rechercher" type="button">
              Rechercher
            </button>
          </div>
        </div>

        <div className={styles.filterSelect}>
          <label className="fr-label" htmlFor="filter-source">
            Filtrer par source
          </label>
          <select
            className="fr-select"
            id="filter-source"
            value={source}
            onChange={(e) => setQueryStates({ source: e.target.value || null })}
          >
            <option value="">Toutes les sources</option>
            {UNIQUE_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterSelect}>
          <label className="fr-label" htmlFor="filter-millesime">
            Filtrer par millésime
          </label>
          <select
            className="fr-select"
            id="filter-millesime"
            value={millesime}
            onChange={(e) => setQueryStates({ millesime: e.target.value || null })}
          >
            <option value="">Tous les millésimes</option>
            {UNIQUE_MILLESIMES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Tabs
        className={fr.cx('fr-mt-4w')}
        selectedTabId={tab}
        onTabChange={(tabId) => {
          setQueryStates({ tab: tabId as 'source' | 'etape' })
        }}
        tabs={[
          { label: 'Par source', tabId: 'source' },
          { label: 'Par étape du parcours', tabId: 'etape' },
        ]}
      >
        {!hasResults ? (
          <p className={fr.cx('fr-mt-2w', 'fr-text--lg')}>Aucun résultat pour cette recherche.</p>
        ) : tab === 'source' ? (
          <SourceView groups={sourceGroups} openAccordion={open} setOpenAccordion={(v) => setQueryStates({ open: v })} />
        ) : (
          <StepView groups={stepGroups} openAccordion={open} setOpenAccordion={(v) => setQueryStates({ open: v })} />
        )}
      </Tabs>
    </section>
  )
}

type AccordionViewProps = {
  openAccordion: string | null
  setOpenAccordion: (value: string | null) => void
}

function SourceView({ groups, openAccordion, setOpenAccordion }: { groups: SourceGroup[] } & AccordionViewProps) {
  return (
    <>
      <Alert
        severity="info"
        small
        description="En cliquant sur chacune des sources, vous pourrez voir les étapes concernées et l'usage détaillé."
        className={fr.cx('fr-mb-2w')}
      />
      <div className={fr.cx('fr-accordions-group')}>
        {groups.map((group) => {
          const accordionId = `source-${slugify(group.source)}`
          return (
            <div key={group.source} id={accordionId}>
              <Accordion
                expanded={openAccordion === accordionId}
                onExpandedChange={(expanded) => setOpenAccordion(expanded ? accordionId : null)}
                label={
                  <span className={styles.accordionLabel}>
                    {group.source}
                    <Badge noIcon small className={styles.badge}>
                      {group.millesime}
                    </Badge>
                  </span>
                }
              >
                <Table
                  noCaption
                  fixed
                  headers={['Étape du parcours', 'Usage détaillé']}
                  data={group.entries.map((entry) => [<strong key={entry.etapeId}>{entry.etape}</strong>, entry.description])}
                />
              </Accordion>
            </div>
          )
        })}
      </div>
    </>
  )
}

function StepView({ groups, openAccordion, setOpenAccordion }: { groups: StepGroup[] } & AccordionViewProps) {
  return (
    <>
      <Alert
        severity="info"
        small
        description="En cliquant sur chacune des étapes, vous pourrez voir les sources mobilisées et l'usage détaillé."
        className={fr.cx('fr-mb-2w')}
      />
      <div className={fr.cx('fr-accordions-group')}>
        {groups.map((group) => (
          <div key={group.etapeId} id={group.etapeId}>
            <Accordion
              expanded={openAccordion === group.etapeId}
              onExpandedChange={(expanded) => setOpenAccordion(expanded ? group.etapeId : null)}
              label={group.etape}
            >
              <Table
                noCaption
                className={styles.stepTable}
                headers={['Source', 'Millésime', 'Usage détaillé']}
                data={group.entries.map((entry) => [
                  <Badge key={entry.source} noIcon small>
                    {entry.source}
                  </Badge>,
                  entry.millesime,
                  entry.description,
                ])}
              />
            </Accordion>
          </div>
        ))}
      </div>
    </>
  )
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
