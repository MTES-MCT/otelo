import { fr } from '@codegouvfr/react-dsfr'

interface ScenarioChange {
  field: string
  label: string
  category: string
  before: unknown
  after: unknown
}

interface EpciChange {
  epciCode: string
  changes: Array<{ field: string; label: string; before: number; after: number }>
}

interface ScenarioDiff {
  type: 'scenario_diff'
  changes: ScenarioChange[]
  epciChanges?: EpciChange[]
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'number') return String(value)
  return String(value)
}

function formatEpciRate(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

function groupByCategory(changes: ScenarioChange[]): Record<string, ScenarioChange[]> {
  const groups: Record<string, ScenarioChange[]> = {}
  for (const change of changes) {
    if (!groups[change.category]) groups[change.category] = []
    groups[change.category].push(change)
  }
  return groups
}

export function ScenarioDiffDetails({ diff }: { diff: ScenarioDiff }) {
  const grouped = groupByCategory(diff.changes)

  return (
    <div className={fr.cx('fr-mt-1v')}>
      {Object.entries(grouped).map(([category, changes]) => (
        <div key={category} className={fr.cx('fr-mb-1v')}>
          <div className={fr.cx('fr-text--xs', 'fr-text--bold', 'fr-mb-0')}>{category}</div>
          {changes.map((change) => (
            <div key={change.field} className={fr.cx('fr-text--xs', 'fr-mb-0')} style={{ paddingLeft: '0.5rem' }}>
              {change.label} :{' '}
              <span style={{ color: 'var(--text-default-error)', textDecoration: 'line-through' }}>{formatValue(change.before)}</span>
              {' → '}
              <span style={{ color: 'var(--text-default-success)', fontWeight: 'bold' }}>{formatValue(change.after)}</span>
            </div>
          ))}
        </div>
      ))}

      {diff.epciChanges?.map((epci) => (
        <div key={epci.epciCode} className={fr.cx('fr-mb-1v')}>
          <div className={fr.cx('fr-text--xs', 'fr-text--bold', 'fr-mb-0')}>EPCI {epci.epciCode}</div>
          {epci.changes.map((change) => (
            <div key={change.field} className={fr.cx('fr-text--xs', 'fr-mb-0')} style={{ paddingLeft: '0.5rem' }}>
              {change.label} :{' '}
              <span style={{ color: 'var(--text-default-error)', textDecoration: 'line-through' }}>{formatEpciRate(change.before)}</span>
              {' → '}
              <span style={{ color: 'var(--text-default-success)', fontWeight: 'bold' }}>{formatEpciRate(change.after)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
