import type { Metadata } from 'next'
import { DatavisualisationAutocomplete } from '~/components/data-visualisation/data-visualisation-autocomplete'
import { DataVisualisationFilters } from '~/components/data-visualisation/data-visualisation-filters'
import { DataVisualisationPage } from '~/components/data-visualisation/data-visualisation-page'
import { SelectDataType } from '~/components/data-visualisation/select-data-type'
import { DataSourceLink } from '~/components/simulations/settings/data-source-link'

export const metadata: Metadata = {
  title: 'Infographies Otelo',
}

export default function InfographiesPage() {
  return (
    <div className="fr-container fr-background-default--grey fr-p-4w">
      <div className="fr-flex fr-direction-column fr-flex-gap-8v">
        <div className="fr-flex fr-flex-gap-8v fr-justify-content-space-between">
          <DatavisualisationAutocomplete />
          <SelectDataType />
        </div>
        <div className="fr-flex fr-justify-content-center fr-align-items-center fr-flex-gap-4v">
          <DataVisualisationFilters />
        </div>
      </div>
      <DataVisualisationPage />
      <div className="fr-pt-2w">
        <DataSourceLink anchor="" />
      </div>
    </div>
  )
}
