import { fr } from '@codegouvfr/react-dsfr'
import classNames from 'classnames'
import { FC } from 'react'
import { WizardStepSlug } from '~/components/simulations/settings/wizard-steps'
import { GUIDE_URL } from '~/utils/resources'
import { buildGuideHref, STEP_QUESTIONS } from './step-questions'
import styles from './wizard-aside.module.css'

type StepQuestionsCardProps = {
  slug: WizardStepSlug
}

export const StepQuestionsCard: FC<StepQuestionsCardProps> = ({ slug }) => {
  const questions = STEP_QUESTIONS[slug]

  if (!questions?.length) {
    return null
  }

  return (
    <div className={classNames(styles.card, 'shadow')}>
      <p className={classNames(styles.cardTitle, fr.cx('fr-text--xs', 'fr-text--bold', 'fr-mb-2w'))}>Vos questions sur cette étape</p>

      <ul className={styles.questionList}>
        {questions.map((question) => (
          <li key={`${question.anchor}-${question.label}`}>
            {/* Nouvel onglet : le paramétrage en cours ne vit que dans l'URL de cet onglet. */}
            <a className={fr.cx('fr-link', 'fr-text--xs')} href={buildGuideHref(question.anchor)} target="_blank" rel="noopener noreferrer">
              {question.label}
            </a>
          </li>
        ))}
        <li>
          <a
            className={fr.cx('fr-link', 'fr-link--icon-right', 'fr-icon-external-link-line', 'fr-text--xs')}
            href={GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Aller plus loin : guide méthodologique
          </a>
        </li>
      </ul>
    </div>
  )
}
