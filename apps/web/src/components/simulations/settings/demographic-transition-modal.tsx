'use client'

import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
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

/**
 * « Ne plus afficher ce message » ne masque que les écrans pédagogiques, identiques d'un scénario à
 * l'autre. L'écran du pic de ménages, propre aux données du territoire, reste toujours affiché.
 */
const DISMISSED_KEY = 'otelo.simulation.demographicTransitionDismissed'

/** Le stockage local jette en navigation privée ou cookies bloqués : jamais bloquant ici. */
const isDismissed = (): boolean => {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

const markAsDismissed = (): void => {
  try {
    localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    // Sans stockage, les écrans reviendront au prochain scénario : c'est sans gravité.
  }
}

type TransitionPage = { title: string; content: ReactNode; dismissible?: boolean }

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
  const [dismissed, setDismissed] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const { peakEpcis, projection, isSingleEpciTerritory } = usePeakEpcis()
  const badHousingNeed = useBadHousingNeed()

  const allPages: TransitionPage[] = [
    ...(peakEpcis.length > 0 && projection
      ? [
          {
            title: "Le nombre de ménages atteint un maximum avant l'horizon",
            content: <PeakYearContent peakEpcis={peakEpcis} projection={projection} isSingleEpciTerritory={isSingleEpciTerritory} />,
          },
        ]
      : []),
    {
      title: 'Le mal-logement intégré à votre estimation',
      dismissible: true,
      content: (
        <>
          <p>
            Vous venez de définir l&apos;évolution du nombre de ménages. Otelo a complété cette première estimation avec une autre
            composante de la demande : le <strong>mal-logement</strong>.
            {badHousingNeed !== null && (
              <>
                {' '}
                Son hypothèse par défaut génère un besoin de <strong>{formatNumber(badHousingNeed)}</strong> logements.
              </>
            )}
          </p>
          <p className="fr-mb-0">Vous pourrez la modifier depuis la page des résultats, une fois votre scénario enregistré.</p>
        </>
      ),
    },
    {
      title: "Prochaines étapes : l'évolution du parc",
      dismissible: true,
      content: (
        <>
          <p>
            Vous allez maintenant examiner comment l&apos;évolution du parc de logements agit sur votre estimation, à travers la vacance de
            longue durée, les résidences secondaires et le renouvellement urbain.
          </p>
          <p className="fr-mb-0">
            La{' '}
            <a
              href="/guide#donnees-parc-logement"
              target="_blank"
              rel="noopener noreferrer"
              title="Vacance de courte durée - nouvelle fenêtre"
            >
              vacance de courte durée
            </a>
            , nécessaire au fonctionnement du parc, est fixée par Otelo.
          </p>
        </>
      ),
    },
  ]

  const pages = dismissed ? allPages.filter((transitionPage) => !transitionPage.dismissible) : allPages

  // Le pic peut arriver après l'ouverture et allonger la liste : on ne sort jamais des bornes.
  const currentIndex = Math.min(pageIndex, pages.length - 1)
  // Liste vide quand les écrans pédagogiques sont masqués sans pic de ménages : la modale reste
  // montée (le DSFR l'ouvre par son id) mais n'est jamais ouverte.
  const page: TransitionPage | undefined = pages[currentIndex]
  const isLastPage = currentIndex === pages.length - 1

  const goToNextStep = () => {
    if (dontShowAgain) markAsDismissed()
    modal.close()
    window.scrollTo({ top: 0 })
    router.push(`${href}?${new URLSearchParams(searchParams)}`)
  }

  const open = () => {
    const isAlreadyDismissed = isDismissed()
    setDismissed(isAlreadyDismissed)
    setPageIndex(0)
    // Écrans pédagogiques masqués et pas de pic de ménages : rien à montrer, on enchaîne.
    if (isAlreadyDismissed && !allPages.some((transitionPage) => !transitionPage.dismissible)) {
      goToNextStep()
      return
    }
    modal.open()
  }

  const forward: ModalProps.ActionAreaButtonProps = isLastPage
    ? { children: "Examiner l'évolution du parc", doClosesModal: false, onClick: goToNextStep }
    : {
        children: 'Continuer',
        iconId: 'fr-icon-arrow-right-line',
        iconPosition: 'right',
        doClosesModal: false,
        onClick: () => setPageIndex(currentIndex + 1),
      }
  const buttons: ModalProps['buttons'] =
    currentIndex > 0
      ? [
          {
            children: 'Précédent',
            priority: 'secondary',
            iconId: 'fr-icon-arrow-left-line',
            iconPosition: 'left',
            doClosesModal: false,
            onClick: () => setPageIndex(currentIndex - 1),
          },
          forward,
        ]
      : [forward]

  return (
    <>
      <NextStepLink href={href} query="omphale" touchedQueryParam="omphaleTouched" onNext={open} />
      <modal.Component title={page?.title ?? ''} buttons={buttons}>
        {page?.content}
        {page?.dismissible && (
          <Checkbox
            className="fr-mt-3w fr-mb-0"
            options={[
              {
                label: 'Ne plus afficher ce message',
                nativeInputProps: { checked: dontShowAgain, onChange: (event) => setDontShowAgain(event.target.checked) },
              },
            ]}
          />
        )}
        {pages.length > 1 && (
          <p className="fr-text--sm fr-text-mention--grey fr-mt-2w fr-mb-0">
            {currentIndex + 1} sur {pages.length}
          </p>
        )}
      </modal.Component>
    </>
  )
}
