'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { Select } from '@codegouvfr/react-dsfr/Select'
import { FC, useState } from 'react'
import { UploadDemographicEvolutionCustom } from '~/components/charts/upload-demographic-evolution-custom'
import { useEpcis } from '~/hooks/use-epcis'

const modal = createModal({ id: 'custom-demographic-evolution-modal', isOpenedByDefault: false })

type CustomDemographicEvolutionModalProps = {
  epcis: string[]
  /** EPCI proposé à l'ouverture : celui affiché par le graphique, à défaut le premier du périmètre. */
  defaultEpciCode: string | null
  scenarioId?: string
  /**
   * La projection de l'Insee n'est pas robuste pour le territoire affiché : l'import est alors mis en
   * avant comme une alternative. Sinon il reste accessible, mais en retrait.
   */
  highlighted?: boolean
}

/**
 * Import d'une projection de ménages « à façon », derrière un bouton plutôt qu'en ligne.
 *
 * Le scénario personnalisé n'est pas un quatrième scénario équivalent aux projections de l'Insee :
 * il remplace la projection d'un EPCI par des données que l'utilisateur apporte. Le ranger dans une
 * modale garde l'étape centrée sur le choix entre les trois projections.
 */
export const CustomDemographicEvolutionModal: FC<CustomDemographicEvolutionModalProps> = ({
  epcis,
  defaultEpciCode,
  scenarioId,
  highlighted = false,
}) => {
  const { data: epciList } = useEpcis(epcis)
  const [selectedEpci, setSelectedEpci] = useState<string | null>(null)
  const epciCode = selectedEpci ?? defaultEpciCode ?? epcis[0] ?? ''

  return (
    <>
      <div className="fr-mb-2w" data-chart-download-exclude>
        {highlighted && (
          <p className="fr-text--sm fr-mb-1w">
            La projection de l&apos;Insee est peu robuste pour ce territoire : si vous disposez de votre propre projection, vous pouvez
            l&apos;utiliser à la place.
          </p>
        )}
        <Button
          priority={highlighted ? 'secondary' : 'tertiary no outline'}
          size="small"
          iconId="fr-icon-upload-line"
          iconPosition="left"
          onClick={() => modal.open()}
        >
          Créer un scénario personnalisé
        </Button>
      </div>
      <modal.Component title="Créer un scénario personnalisé" size="large">
        <p>
          Si vous disposez de votre propre projection du nombre de ménages pour un EPCI, vous pouvez l&apos;importer : elle remplacera, pour
          cet EPCI, la projection de l&apos;Insee.
        </p>
        {epcis.length > 1 && (
          <Select label="EPCI concerné" nativeSelectProps={{ value: epciCode, onChange: (event) => setSelectedEpci(event.target.value) }}>
            {(epciList ?? []).map((epci) => (
              <option key={epci.code} value={epci.code}>
                {epci.name}
              </option>
            ))}
          </Select>
        )}
        {epciCode && <UploadDemographicEvolutionCustom epciCode={epciCode} scenarioId={scenarioId} onUploaded={() => modal.close()} />}
      </modal.Component>
    </>
  )
}
