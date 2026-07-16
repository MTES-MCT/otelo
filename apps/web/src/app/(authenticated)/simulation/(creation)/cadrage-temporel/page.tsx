import type { Metadata } from 'next'
import { NextStepLink } from '~/components/simulations/settings/next-step-link'
import { PreviousStepLink } from '~/components/simulations/settings/previous-step-link'
import { SelectMillesimeModal } from '~/components/simulations/settings/select-millesime-modal'
import { SelectProjectionPeriod } from '~/components/simulations/settings/select-projection-period'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'

export const metadata: Metadata = {
  title: 'Elaborer scenario - étape 2 sur 6 - Otelo',
}
export default async function TemporalChoicePage() {
  const href = `/simulation/parametrages-demographique`

  return (
    <>
      <div
        className="fr-flex fr-direction-column fr-background-default--grey fr-p-2w fr-pt-md-3w fr-pb-md-5w fr-px-md-5w fr-border-top shadow"
        {...tutorialAnchor('projection-period')}
      >
        <div className="fr-mb-4w">
          <SelectMillesimeModal />
        </div>
        <SelectProjectionPeriod />
      </div>
      <div className="fr-flex fr-flex-gap-6v fr-justify-content-end fr-py-4w fr-px-2w">
        <PreviousStepLink />
        <NextStepLink href={href} query="projection" defaultValue="2030" />
      </div>
    </>
  )
}
