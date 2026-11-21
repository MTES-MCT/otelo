'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import Button from '@codegouvfr/react-dsfr/Button'
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup'
import Input from '@codegouvfr/react-dsfr/Input'
import Link from 'next/link'
import { FC, FormEvent, useRef, useState } from 'react'
import { isValidAmfEmail, TAmfShareContactsBody, TAmfSharedContact } from '~/components/amf/amf-types'

const MAX_CONTACTS = 10
const INVALID_EMAIL_MESSAGE = 'Veuillez saisir une adresse e-mail valide, par exemple nom@domaine.fr.'

type ContactRow = TAmfSharedContact & { id: number }

type AmfShareFormProps = {
  leadId: string
}

export const AmfShareForm: FC<AmfShareFormProps> = ({ leadId }) => {
  const nextId = useRef(1)
  const [email, setEmail] = useState('')
  const [isEmailInvalid, setIsEmailInvalid] = useState(false)
  // Les contacts sont facultatifs : aucune ligne tant que l'utilisateur n'en ajoute pas.
  const [rows, setRows] = useState<ContactRow[]>([])
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  // Lignes dont l'e-mail serait refusé par l'API, signalées avant tout envoi.
  const [invalidEmails, setInvalidEmails] = useState<Set<number>>(new Set())
  const submitting = useRef(false)

  const updateRow = (id: number, patch: Partial<TAmfSharedContact>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
    if (patch.email !== undefined && invalidEmails.has(id)) {
      setInvalidEmails((current) => new Set([...current].filter((rowId) => rowId !== id)))
    }
  }

  const addRow = () => {
    setRows((current) => (current.length >= MAX_CONTACTS ? current : [...current, { id: nextId.current++, role: '', email: '' }]))
  }

  const removeRow = (id: number) => {
    setRows((current) => current.filter((row) => row.id !== id))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) {
      return
    }
    const emailInvalid = !isValidAmfEmail(email.trim())
    const invalid = new Set(rows.filter((row) => !isValidAmfEmail(row.email.trim())).map((row) => row.id))
    setIsEmailInvalid(emailInvalid)
    setInvalidEmails(invalid)
    if (emailInvalid || invalid.size > 0) {
      return
    }
    submitting.current = true
    setStatus('submitting')

    const body: TAmfShareContactsBody = {
      email: email.trim(),
      contacts: rows.map(({ role, email }) => ({ role: role.trim(), email: email.trim() })),
    }

    try {
      const res = await fetch(`/api/amf/leads/${encodeURIComponent(leadId)}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setStatus(res.status === 204 ? 'done' : 'error')
    } catch {
      setStatus('error')
    } finally {
      submitting.current = false
    }
  }

  return (
    <section className={fr.cx('fr-mt-5w')} aria-labelledby="amf-share-title">
      <h2 id="amf-share-title" className={fr.cx('fr-h4')}>
        Recevoir et partager ces résultats
      </h2>

      {status === 'done' ? (
        <Alert
          severity="success"
          small
          description="Merci, votre demande a bien été enregistrée : l'équipe Otelo vous transmettra ces résultats par e-mail sous 72 heures."
        />
      ) : (
        <form onSubmit={handleSubmit}>
          <Input
            label="Votre e-mail"
            hintText={
              <>
                Votre e-mail sera utilisé par l&apos;équipe Otelo pour vous transmettre ces résultats et vous recontacter au sujet de votre
                besoin en logement.{' '}
                <Link href="/donnees-personnelles" target="_blank">
                  Données personnelles
                </Link>
              </>
            }
            state={isEmailInvalid ? 'error' : 'default'}
            stateRelatedMessage={isEmailInvalid ? INVALID_EMAIL_MESSAGE : undefined}
            nativeInputProps={{
              type: 'email',
              name: 'email',
              autoComplete: 'email',
              required: true,
              value: email,
              onChange: (event) => {
                setEmail(event.target.value)
                setIsEmailInvalid(false)
              },
            }}
          />

          <p className={fr.cx('fr-mb-2w')}>Vous pouvez aussi partager ces résultats avec d&apos;autres personnes (facultatif).</p>

          {rows.map((row, index) => (
            <fieldset key={row.id} className={fr.cx('fr-fieldset', 'fr-mb-2w')} aria-label={`Contact ${index + 1}`}>
              <div className={fr.cx('fr-fieldset__element')}>
                <Input
                  label="Fonction"
                  hintText="Par exemple : DGS, chef de service habitat"
                  nativeInputProps={{
                    required: true,
                    maxLength: 100,
                    value: row.role,
                    onChange: (event) => updateRow(row.id, { role: event.target.value }),
                  }}
                />
              </div>
              <div className={fr.cx('fr-fieldset__element')}>
                <Input
                  label="E-mail"
                  state={invalidEmails.has(row.id) ? 'error' : 'default'}
                  stateRelatedMessage={invalidEmails.has(row.id) ? INVALID_EMAIL_MESSAGE : undefined}
                  nativeInputProps={{
                    type: 'email',
                    required: true,
                    autoComplete: 'off',
                    value: row.email,
                    onChange: (event) => updateRow(row.id, { email: event.target.value }),
                  }}
                />
              </div>
              <div className={fr.cx('fr-fieldset__element')}>
                <Button
                  type="button"
                  priority="tertiary no outline"
                  size="small"
                  iconId="ri-delete-bin-line"
                  onClick={() => removeRow(row.id)}
                >
                  Retirer ce contact
                </Button>
              </div>
            </fieldset>
          ))}

          {status === 'error' && (
            <Alert
              className={fr.cx('fr-mb-2w')}
              severity="error"
              small
              description="Votre demande n'a pas pu être envoyée. Veuillez réessayer."
            />
          )}

          <ButtonsGroup
            inlineLayoutWhen="md and up"
            buttons={[
              {
                children: 'Ajouter un contact',
                priority: 'secondary',
                iconId: 'ri-add-line',
                type: 'button',
                onClick: addRow,
                disabled: rows.length >= MAX_CONTACTS,
              },
              {
                children: status === 'submitting' ? 'Envoi en cours…' : 'Envoyer',
                type: 'submit',
                disabled: status === 'submitting',
              },
            ]}
          />
        </form>
      )}
    </section>
  )
}
