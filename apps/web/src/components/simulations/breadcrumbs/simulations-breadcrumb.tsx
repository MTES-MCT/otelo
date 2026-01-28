import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { TSimulationWithResults } from '~/schemas/simulation'

type SimulationsBreadcrumbProps = {
  simulation: TSimulationWithResults
  groupName: string
}

export const SimulationsBreadcrumb = ({ groupName, simulation }: SimulationsBreadcrumbProps) => {
  return (
    <Breadcrumb
      currentPageLabel={`Résultats ${simulation.name}`}
      homeLinkProps={{
        href: '/',
      }}
      segments={[
        {
          label: groupName,
          linkProps: { href: `/tableaux-de-bord` },
        },
      ]}
    />
  )
}
