import Tag from '@codegouvfr/react-dsfr/Tag'

export const SimulationHeaderTitle = ({ name, projection, millesime }: { name: string; projection: number; millesime: string }) => {
  return (
    <div className="fr-flex fr-align-items-center fr-flex-gap-4v">
      <h1 className="fr-h2 fr-text-title--blue-france fr-mb-0">{name}</h1>
      <Tag as="span" nativeSpanProps={{ className: 'fr-background-default--grey fr-text-title--blue-france fr-text--medium' }}>
        {millesime} → {projection}
      </Tag>
    </div>
  )
}
