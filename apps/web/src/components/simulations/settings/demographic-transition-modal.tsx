'use client'

import type { ModalProps } from '@codegouvfr/react-dsfr/Modal'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { buildEstimationBreakdown } from '@shared'
import { useRouter, useSearchParams } from 'next/navigation'
import { FC, ReactNode, useState } from 'react'
import { useCreationPreviewPayload } from '~/hooks/use-creation-preview-payload'
import { useEpcis } from '~/hooks/use-epcis'
import { useCreationPeakYears } from '~/hooks/use-simulation-peak-years'
import { useSimulationPreview } from '~/hooks/use-simulation-preview'
import { formatNumber } from '~/utils/format-numbers'
import { NextStepLink } from './next-step-link'

const modal = createModal({ id: 'demographic-transition-modal', isOpenedByDefault: false })

type TransitionPage = { title: string; content: ReactNode }

type PeakEpci = { code: string; name: string; peakYear: number }

const PeakYearContent: FC<{ peakEpcis: PeakEpci[]; projection: number; isSingleEpciTerritory: boolean }> = ({
  peakEpcis,
  projection,
  isSingleEpciTerritory,
}) => {
  if (isSingleEpciTerritory) {
    const { peakYear } = peakEpcis[0]
    return (
      <p>
        Votre projection prévoit un <strong>pic de ménages en {peakYear}</strong>, avant l&apos;horizon {projection}. À partir de cette
        date, le besoin en résidences principales n&apos;augmente plus. Otelo considère donc que les objectifs de vacance et de résidences
        secondaires doivent être atteints en <strong>{peakYear}</strong>, et non en {projection}. Vous retrouverez cette date dans les deux
        étapes suivantes.
      </p>
    )
  }

  // Chaque EPCI a sa propre trajectoire : le pic n'intervient ni partout, ni la même année.
  return (
    <>
      <p>Votre projection prévoit un pic de ménages avant l&apos;horizon {projection} pour les EPCI suivants :</p>
      <ul>
        {peakEpcis.map(({ code, name, peakYear }) => (
          <li key={code}>
            {name} : <strong>{peakYear}</strong>
          </li>
        ))}
      </ul>
      <p>
        À partir de cette date, le besoin en résidences principales n&apos;augmente plus. Otelo considère donc que, pour ces EPCI, les
        objectifs de vacance et de résidences secondaires doivent être atteints l&apos;année du pic, et non en {projection}. Vous
        retrouverez ces dates dans les deux étapes suivantes.
      </p>
    </>
  )
}

const usePeakEpcis = (): { peakEpcis: PeakEpci[]; projection: number | null; isSingleEpciTerritory: boolean } => {
  const { peakYears, projection } = useCreationPeakYears()
  const epciCodes = Object.keys(peakYears)
  const { data: epcis } = useEpcis(epciCodes.length > 0 ? epciCodes : undefined)

  const peakEpcis = projection
    ? epciCodes
        .filter((code) => peakYears[code] && peakYears[code] < projection)
        .map((code) => ({ code, name: epcis?.find((epci) => epci?.code === code)?.name ?? code, peakYear: peakYears[code] }))
    : []

  return { peakEpcis, projection, isSingleEpciTerritory: epciCodes.length === 1 }
}

/** Besoin lié au mal-logement sur tout le territoire, tel que l'affiche la colonne « Votre scénario ». */
const useBadHousingNeed = (): number | null => {
  const { payload, enabled } = useCreationPreviewPayload()
  // Même requête que la colonne scénario : elle est déjà en cache à cette étape.
  const { data } = useSimulationPreview(payload, { enabled })
  return data ? Math.round(buildEstimationBreakdown(data).values.badHousing) : null
}

/**
 * Bouton « Suivant » de l'étape démographique, qui intercale une modale avant l'évolution du parc.
 *
 * Le passage de la demande (démographie) à l'offre (parc de logements) est le moment où l'utilisateur
 * doit comprendre ce qu'Otelo ajoute de lui-même — le mal-logement — et, le cas échéant, que le pic de
 * ménages déplace l'échéance des objectifs qu'il s'apprête à fixer. Textes repris de la feuille
 * « Fenêtres intermédiaires » du référentiel métier.
 */
export const DemographicNextStep: FC<{ href: string }> = ({ href }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pageIndex, setPageIndex] = useState(0)
  const { peakEpcis, projection, isSingleEpciTerritory } = usePeakEpcis()
  const badHousingNeed = useBadHousingNeed()

  const pages: TransitionPage[] = [
    ...(peakEpcis.length > 0 && projection
      ? [
          {
            title: "Le nombre de ménages atteint un maximum avant l'horizon",
            content: <PeakYearContent peakEpcis={peakEpcis} projection={projection} isSingleEpciTerritory={isSingleEpciTerritory} />,
          },
        ]
      : []),
    {
      title: 'La prise en compte du mal-logement',
      content: (
        <p>
          Vous venez de paramétrer les évolutions démographiques de votre territoire. Une autre composante de la demande de logements est
          prise en compte à ce stade par Otelo : <strong>la résorption du mal-logement</strong>. Vous pourrez la modifier à la fin du
          parcours, depuis la fenêtre de résultats.
          {badHousingNeed !== null && (
            <>
              {' '}
              Son paramétrage par défaut génère un besoin de <strong>{formatNumber(badHousingNeed)} logements</strong> pour l&apos;instant.
            </>
          )}
        </p>
      ),
    },
    {
      title: "Prochaines étapes : l'évolution du parc",
      content: (
        <>
          <p>
            À population donnée, plusieurs leviers permettent de répondre aux besoins en logements. Vous allez maintenant paramétrer les
            évolutions du parc de logements : <strong>la vacance de longue durée, les résidences secondaires et le renouvellement</strong>.
          </p>
          <p>
            Ces paramètres déterminent dans quelle mesure la mobilisation du parc existant peut contribuer à répondre aux besoins en
            logements, ou, au contraire, à les accroître.
          </p>
          <p className="fr-mb-0">
            À noter que la vacance de courte durée, nécessaire au fonctionnement du parc, est fixée et non modifiable.
          </p>
        </>
      ),
    },
  ]

  // Le pic peut arriver après l'ouverture et allonger la liste : on ne sort jamais des bornes.
  const currentIndex = Math.min(pageIndex, pages.length - 1)
  const page = pages[currentIndex]
  const isLastPage = currentIndex === pages.length - 1

  const open = () => {
    setPageIndex(0)
    modal.open()
  }

  const goToNextStep = () => {
    modal.close()
    window.scrollTo({ top: 0 })
    router.push(`${href}?${new URLSearchParams(searchParams)}`)
  }

  const forward = isLastPage
    ? { children: 'Continuer', doClosesModal: false, onClick: goToNextStep }
    : { children: 'Suivant', doClosesModal: false, onClick: () => setPageIndex(currentIndex + 1) }
  const buttons: ModalProps['buttons'] =
    currentIndex > 0
      ? [{ children: 'Précédent', priority: 'secondary', doClosesModal: false, onClick: () => setPageIndex(currentIndex - 1) }, forward]
      : [forward]

  return (
    <>
      <NextStepLink href={href} query="omphale" touchedQueryParam="omphaleTouched" onNext={open} />
      <modal.Component title={page.title} buttons={buttons} size="large">
        {page.content}
        {pages.length > 1 && (
          <p className="fr-text--sm fr-text-mention--grey fr-mt-2w fr-mb-0">
            {currentIndex + 1} sur {pages.length}
          </p>
        )}
      </modal.Component>
    </>
  )
}
