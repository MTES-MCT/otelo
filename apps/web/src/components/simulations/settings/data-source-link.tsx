import Button from '@codegouvfr/react-dsfr/Button'

type DataSourceLinkProps = {
  anchor: string
}

export function DataSourceLink({ anchor }: DataSourceLinkProps) {
  const etapeId = anchor.replace('#', '')
  return (
    <Button
      priority="tertiary no outline"
      iconId="ri-database-2-line"
      size="small"
      linkProps={{ href: `/sources-de-donnees?tab=etape&open=${etapeId}`, target: '_blank' }}
    >
      Sources de données
    </Button>
  )
}
