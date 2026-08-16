'use client'

import { Button } from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import classNames from 'classnames'
import { FC, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useFeedbackStatus } from '~/hooks/use-feedback-status'
import { useSnoozeFeedback } from '~/hooks/use-snooze-feedback'
import { useSubmitFeedback } from '~/hooks/use-submit-feedback'
import { trackEvent } from '~/lib/tracking'
import styles from './feedback-banner.module.css'

const SNOOZE_KEY = 'otelo-feedback-snoozed'

const ZFeedbackForm = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
})

type TFeedbackForm = z.infer<typeof ZFeedbackForm>

export const FeedbackBanner: FC = () => {
  const { data: feedbackStatus, isLoading } = useFeedbackStatus()
  const { mutate: submitFeedback, isPending: isSubmitting } = useSubmitFeedback()
  const { mutate: snoozeFeedback, isPending: isSnoozing } = useSnoozeFeedback()
  const [snoozedInSession, setSnoozedInSession] = useState(false)
  const prevHasSimulations = useRef<boolean | undefined>(undefined)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TFeedbackForm>({
    resolver: zodResolver(ZFeedbackForm),
  })

  const selectedRating = watch('rating')

  useEffect(() => {
    setSnoozedInSession(sessionStorage.getItem(SNOOZE_KEY) === 'true')
  }, [])

  useEffect(() => {
    if (feedbackStatus && prevHasSimulations.current === false && feedbackStatus.hasSimulations && feedbackStatus.status === 'SNOOZED') {
      sessionStorage.removeItem(SNOOZE_KEY)
      setSnoozedInSession(false)
    }
    prevHasSimulations.current = feedbackStatus?.hasSimulations
  }, [feedbackStatus])

  if (isLoading || !feedbackStatus) {
    return null
  }

  if (feedbackStatus.status === 'SUBMITTED') {
    return null
  }

  if (feedbackStatus.status === 'SNOOZED' && snoozedInSession) {
    return null
  }

  const onSubmit = (data: TFeedbackForm) => {
    trackEvent({ action: 'feedback', category: 'Engagement', name: 'envoi', value: data.rating })
    submitFeedback(data)
  }

  const handleSnooze = () => {
    trackEvent({ action: 'feedback', category: 'Engagement', name: 'report' })
    snoozeFeedback(undefined, {
      onSuccess: () => {
        sessionStorage.setItem(SNOOZE_KEY, 'true')
        setSnoozedInSession(true)
      },
    })
  }

  return (
    <div className={styles.banner}>
      <div className="fr-container">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.header}>
            <div>
              <h4 className={styles.title}>Votre avis compte !</h4>
            </div>
          </div>

          <div className={styles.ratingSection}>
            <span className={styles.ratingQuestion}>Sur une échelle de 1 à 5, à quel point êtes-vous satisfait(e) d'Otelo ?</span>
            <div className={styles.ratingButtons}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={classNames(styles.ratingButton, selectedRating === value && styles.ratingButtonSelected)}
                  onClick={() => setValue('rating', value, { shouldValidate: true })}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className={styles.ratingLabels}>
              <span>Pas du tout satisfait</span>
              <span>Très satisfait</span>
            </div>
            {errors.rating && <p className={styles.error}>{errors.rating.message}</p>}
          </div>

          <Input
            className={styles.commentInput}
            textArea
            label="Commentaire (optionnel)"
            nativeTextAreaProps={{
              placeholder: 'Partagez vos suggestions, remarques ou difficultés rencontrées...',
              rows: 2,
              ...register('comment'),
            }}
            state={errors.comment ? 'error' : 'default'}
            stateRelatedMessage={errors.comment?.message}
          />

          <div className={styles.actions}>
            <Button
              type="button"
              priority={!feedbackStatus.hasSimulations ? 'primary' : 'tertiary'}
              size="small"
              onClick={handleSnooze}
              disabled={isSnoozing || isSubmitting}
            >
              Répondre plus tard
            </Button>
            <Button type="submit" priority="primary" size="small" disabled={isSnoozing || isSubmitting}>
              Envoyer
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
