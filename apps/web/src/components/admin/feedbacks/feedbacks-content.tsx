'use client'

import { Button } from '@codegouvfr/react-dsfr/Button'
import { Card } from '@codegouvfr/react-dsfr/Card'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'

interface Feedback {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: { email: string }
}

interface FeedbacksContentProps {
  feedbacks: Feedback[]
  startDate?: string
  endDate?: string
}

export function FeedbacksContent({ feedbacks, startDate, endDate }: FeedbacksContentProps) {
  const router = useRouter()
  const startDateRef = useRef<HTMLInputElement>(null)
  const endDateRef = useRef<HTMLInputElement>(null)

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (startDateRef.current?.value) params.set('startDate', startDateRef.current.value)
    if (endDateRef.current?.value) params.set('endDate', endDateRef.current.value)
    const queryString = params.toString()
    router.push(`/admin/feedbacks${queryString ? `?${queryString}` : ''}`)
  }

  return (
    // Le titre et le conteneur sont fournis par la coquille d'administration.
    <>
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-5v">
        <div className="fr-col-12 fr-col-md-4">
          <Input
            label="Date de début"
            nativeInputProps={{
              type: 'date',
              defaultValue: startDate,
              ref: startDateRef,
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <Input
            label="Date de fin"
            nativeInputProps={{
              type: 'date',
              defaultValue: endDate,
              ref: endDateRef,
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-flex fr-align-items-end">
          <Button onClick={handleFilter}>Filtrer</Button>
        </div>
      </div>

      {feedbacks.length === 0 ? (
        <p>Aucun retour utilisateur pour cette période.</p>
      ) : (
        <>
          <p className="fr-mb-3v">
            {feedbacks.length} retour{feedbacks.length > 1 ? 's' : ''} utilisateur{feedbacks.length > 1 ? 's' : ''}
          </p>
          <div className="fr-grid-row fr-grid-row--gutters">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="fr-col-12 fr-col-md-6 fr-col-lg-4">
                <Card
                  title={`Note : ${feedback.rating}/5`}
                  titleAs="h3"
                  desc={
                    <>
                      {feedback.comment && <p className="fr-mb-2v">{feedback.comment}</p>}
                      <span className="fr-text--sm fr-mb-1v">
                        <a href={`mailto:${feedback.user.email}`}>{feedback.user.email}</a>
                      </span>
                      <p className="fr-text--xs fr-mb-0">
                        {new Date(feedback.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </>
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
