'use client'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox'
import Input from '@codegouvfr/react-dsfr/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import { FC } from 'react'
import { useForm } from 'react-hook-form'
import { tss } from 'tss-react'
import { useContactForm } from '~/hooks/use-contact-form'
import { TContactForm, ZContactForm } from '~/schemas/contact-form'

export const ContactForm: FC = () => {
  const { classes } = useStyles()
  const { submitContactForm, isLoading, error } = useContactForm()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TContactForm>({
    resolver: zodResolver(ZContactForm),
    values: {
      consent: false,
      email: '',
      firstname: '',
      lastname: '',
      message: '',
      subject: '',
    },
  })

  const onSubmit = async (data: TContactForm) => {
    await submitContactForm(data)
    if (!error) {
      reset()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label={
          <span>
            Prénom <RequiredMark /> :
          </span>
        }
        nativeInputProps={{
          autoComplete: 'given-name',
          name: 'firstname',
          placeholder: 'Votre prénom',
        }}
        state={errors.firstname ? 'error' : 'default'}
        stateRelatedMessage={errors.firstname?.message}
        {...register('firstname')}
      />
      <Input
        label={
          <span>
            Nom de famille <RequiredMark /> :
          </span>
        }
        required
        nativeInputProps={{
          autoComplete: 'family-name',
          name: 'lastname',
          placeholder: 'Votre nom de famille',
        }}
        state={errors.lastname ? 'error' : 'default'}
        stateRelatedMessage={errors.lastname?.message}
        {...register('lastname')}
      />

      <Input
        label={
          <span>
            Adresse e-mail <RequiredMark /> :
          </span>
        }
        nativeInputProps={{
          autoComplete: 'email',
          name: 'email',
          placeholder: 'Votre adresse e-mail',
        }}
        hintText="Format attendu : nom@domaine.fr"
        state={errors.email ? 'error' : 'default'}
        stateRelatedMessage={errors.email?.message}
        {...register('email')}
      />

      <Input
        label={
          <span>
            Objet de la demande <RequiredMark /> :
          </span>
        }
        nativeInputProps={{
          name: 'subject',
          placeholder: 'Sujet de votre demande',
        }}
        state={errors.subject ? 'error' : 'default'}
        stateRelatedMessage={errors.subject?.message}
        {...register('subject')}
      />
      <Input
        className={classes.textareaWrapper}
        textArea
        label={
          <span>
            Message <RequiredMark /> :
          </span>
        }
        nativeTextAreaProps={{
          name: 'message',
          placeholder: 'Votre message',
        }}
        state={errors.message ? 'error' : 'default'}
        stateRelatedMessage={errors.message?.message}
        {...register('message')}
      />
      <Checkbox
        options={[
          {
            label: (
              <span>
                En cochant cette case, vous comprenez que les données personnelles entrées, adresse IP comprise, pourront être utilisées
                afin de vous contacter dans le cadre de votre intérêt légitime. <RequiredMark />
              </span>
            ),
            nativeInputProps: {
              ...register('consent'),
            },
          },
        ]}
        state={errors.consent ? 'error' : 'default'}
        stateRelatedMessage={errors.consent?.message}
      />
      <div className="fr-grid-row fr-grid-row--right">
        <Button
          className="fr-col-md-4 fr-col-12 fr-grid-row--center fr-mt-2w fr-mt-md-0"
          priority="primary"
          type="submit"
          iconPosition="right"
          iconId="fr-icon-send-plane-line"
          disabled={isLoading}
        >
          {isLoading ? 'Envoi en cours...' : 'Envoyer ma demande'}
        </Button>
      </div>
    </form>
  )
}

const RequiredMark = () => <span aria-hidden="true">*</span>

const useStyles = tss.create({
  textareaWrapper: {
    textarea: {
      height: '130px',
    },
  },
})
