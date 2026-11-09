'use client'

import { fr } from '@codegouvfr/react-dsfr'
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup'
import Stepper from '@codegouvfr/react-dsfr/Stepper'
import { FC, FormEvent, useEffect, useRef, useState } from 'react'
import { AmfResults } from '~/components/amf/amf-results'
import {
  AmfBadHousingStep,
  AmfDemographyStep,
  AmfEmailStep,
  AmfEpciStep,
  AmfIntroStep,
  AmfSecondaryResidencesStep,
  AmfVacancyStep,
} from '~/components/amf/amf-steps'
import {
  AMF_STEPS,
  isValidAmfEmail,
  TAmfCreateSimulationBody,
  TAmfCreateSimulationResponse,
  TAmfDraftAnswers,
  TAmfStep,
} from '~/components/amf/amf-types'
import styles from './amf.module.css'

/** Étapes suivies par la barre de progression : les questions, de l'EPCI à l'e-mail. */
const QUESTION_STEPS: Partial<Record<TAmfStep, string>> = {
  epci: 'Votre territoire',
  demography: 'Évolution de la population',
  vacancy: 'Logements vacants',
  badHousing: 'Mal-logement',
  secondaryResidences: 'Résidences secondaires',
  email: 'Votre e-mail',
}
const QUESTION_STEP_KEYS = AMF_STEPS.filter((step) => step in QUESTION_STEPS)

const EMPTY_ANSWERS: TAmfDraftAnswers = {
  epci: null,
  demography: null,
  vacancy: null,
  badHousing: null,
  secondaryResidences: null,
  email: '',
}

/** Message d'erreur selon le statut : seul un 400 met en cause la saisie (l'e-mail). */
const errorMessageFor = (status: number): string => {
  if (status === 400) {
    return "Le calcul n'a pas pu aboutir. Veuillez vérifier votre e-mail et réessayer."
  }
  if (status === 429) {
    return 'Trop de demandes en peu de temps. Veuillez patienter un instant avant de réessayer.'
  }
  return 'Une erreur est survenue, merci de réessayer dans quelques instants.'
}

type Submission = { status: 'idle' } | { status: 'submitting' } | { status: 'error'; message: string }

export const AmfQuestionnaire: FC = () => {
  const [step, setStep] = useState<TAmfStep>('intro')
  const [answers, setAnswers] = useState<TAmfDraftAnswers>(EMPTY_ANSWERS)
  const [outcome, setOutcome] = useState<TAmfCreateSimulationResponse | null>(null)
  const [submission, setSubmission] = useState<Submission>({ status: 'idle' })
  // Garde synchrone contre le double tap : l'état React n'est pas encore à jour au second clic.
  const submitting = useRef(false)
  const topRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    // À chaque changement d'écran, on remonte en haut et on y place le focus clavier.
    topRef.current?.scrollIntoView({ block: 'start' })
    topRef.current?.focus({ preventScroll: true })
  }, [step])

  const update = (patch: Partial<TAmfDraftAnswers>) => setAnswers((current) => ({ ...current, ...patch }))

  const goTo = (offset: 1 | -1) => {
    const index = AMF_STEPS.indexOf(step)
    setStep(AMF_STEPS[index + offset])
  }

  const restart = () => {
    setAnswers(EMPTY_ANSWERS)
    setOutcome(null)
    setSubmission({ status: 'idle' })
    setStep('intro')
  }

  const canContinue = (): boolean => {
    switch (step) {
      case 'epci':
        return answers.epci !== null
      case 'demography':
        return answers.demography !== null
      case 'vacancy':
        return answers.vacancy !== null
      case 'badHousing':
        return answers.badHousing !== null
      case 'secondaryResidences':
        return answers.secondaryResidences !== null
      default:
        return true
    }
  }

  const submit = async () => {
    if (submitting.current) {
      return
    }
    const { epci, demography, vacancy, badHousing, secondaryResidences } = answers
    if (!epci || !demography || !vacancy || badHousing === null || !secondaryResidences) {
      return
    }
    const email = answers.email.trim()
    if (!isValidAmfEmail(email)) {
      setSubmission({ status: 'error', message: 'Veuillez saisir une adresse e-mail valide, par exemple nom@domaine.fr.' })
      return
    }

    submitting.current = true
    setSubmission({ status: 'submitting' })

    const body: TAmfCreateSimulationBody = { epciCode: epci.code, demography, vacancy, badHousing, secondaryResidences, email }

    try {
      const res = await fetch('/api/amf/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        setSubmission({ status: 'error', message: errorMessageFor(res.status) })
        return
      }
      setOutcome((await res.json()) as TAmfCreateSimulationResponse)
      setSubmission({ status: 'idle' })
      setStep('results')
    } catch {
      setSubmission({ status: 'error', message: 'Une erreur est survenue, merci de réessayer dans quelques instants.' })
    } finally {
      submitting.current = false
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (step === 'email') {
      void submit()
    } else if (canContinue()) {
      goTo(1)
    }
  }

  const questionIndex = QUESTION_STEP_KEYS.indexOf(step)
  const isQuestion = questionIndex !== -1

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return <AmfIntroStep />
      case 'epci':
        // Changer de territoire invalide le choix démographique : les options proposées en dépendent.
        return <AmfEpciStep epci={answers.epci} onChange={(epci) => update({ epci, demography: null })} />
      case 'demography':
        return answers.epci ? (
          <AmfDemographyStep epci={answers.epci} value={answers.demography} onChange={(demography) => update({ demography })} />
        ) : null
      case 'vacancy':
        return <AmfVacancyStep value={answers.vacancy} onChange={(vacancy) => update({ vacancy })} />
      case 'badHousing':
        return <AmfBadHousingStep value={answers.badHousing} onChange={(badHousing) => update({ badHousing })} />
      case 'secondaryResidences':
        return (
          <AmfSecondaryResidencesStep
            value={answers.secondaryResidences}
            onChange={(secondaryResidences) => update({ secondaryResidences })}
          />
        )
      case 'email':
        return (
          <AmfEmailStep
            value={answers.email}
            onChange={(email) => {
              update({ email })
              if (submission.status === 'error') setSubmission({ status: 'idle' })
            }}
            error={submission.status === 'error' ? submission.message : null}
          />
        )
      case 'results':
        return null
    }
  }

  if (step === 'results' && outcome) {
    return (
      <div ref={topRef} tabIndex={-1} className={styles.card}>
        <AmfResults result={outcome.result} leadId={outcome.leadId} />
        <ButtonsGroup
          className={fr.cx('fr-mt-5w')}
          inlineLayoutWhen="md and up"
          buttons={[
            { children: 'Découvrir Otelo', linkProps: { href: '/' } },
            { children: 'Refaire une simulation', priority: 'secondary', onClick: restart, type: 'button' },
          ]}
        />
      </div>
    )
  }

  return (
    <div ref={topRef} tabIndex={-1} className={styles.card}>
      {isQuestion && (
        <>
          <h1 className={fr.cx('fr-sr-only')}>Votre besoin en logements en 3 minutes</h1>
          <Stepper
            currentStep={questionIndex + 1}
            stepCount={QUESTION_STEP_KEYS.length}
            title={QUESTION_STEPS[step]}
            nextTitle={QUESTION_STEPS[QUESTION_STEP_KEYS[questionIndex + 1]]}
          />
        </>
      )}

      <form onSubmit={handleSubmit} noValidate={step === 'email'}>
        {renderStep()}

        <ButtonsGroup
          className={fr.cx('fr-mt-4w')}
          inlineLayoutWhen="md and up"
          alignment="between"
          buttons={
            step === 'intro'
              ? [{ children: 'Commencer', type: 'button', onClick: () => goTo(1) }]
              : [
                  {
                    children: 'Retour',
                    priority: 'secondary',
                    iconId: 'fr-icon-arrow-left-line',
                    type: 'button',
                    onClick: () => goTo(-1),
                    disabled: submission.status === 'submitting',
                  },
                  step === 'email'
                    ? {
                        children: submission.status === 'submitting' ? 'Calcul en cours…' : 'Voir mes résultats',
                        type: 'submit',
                        disabled: submission.status === 'submitting',
                      }
                    : { children: 'Suivant', type: 'submit', disabled: !canContinue() },
                ]
          }
        />
      </form>
    </div>
  )
}
