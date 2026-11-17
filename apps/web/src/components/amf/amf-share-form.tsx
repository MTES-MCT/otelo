'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import Button from '@codegouvfr/react-dsfr/Button'
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup'
import Input from '@codegouvfr/react-dsfr/Input'
import { FC, FormEvent, useRef, useState } from 'react'
import { isValidAmfEmail, TAmfShareContactsBody, TAmfSharedContact } from '~/components/amf/amf-types'

const MAX_CONTACTS = 10

type ContactRow = TAmfSharedContact & { id: number }

type AmfShareFormProps = {
  leadId: string
}

export const AmfShareForm: FC<AmfShareFormProps> = ({ leadId }) => {
  const nextId = useRef(1)
  const [rows, setRows] = useState<ContactRow[]>([{ id: 0, role: '', email: '' }])
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
    const invalid = new Set(rows.filter((row) => !isValidAmfEmail(row.email.trim())).map((row) => row.id))
    setInvalidEmails(invalid)
    if (invalid.size > 0) {
      return
    }
    submitting.current = true
    setStatus('submitting')

    const body: TAmfShareContactsBody = {
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
        À qui souhaitez-vous partager ces résultats ?
      </h2>

      {status === 'done' ? (
        <Alert severity="success" small description="Merci, vos contacts ont bien été enregistrés." />
      ) : (
        <form onSubmit={handleSubmit}>
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
                  stateRelatedMessage={
                    invalidEmails.has(row.id) ? 'Veuillez saisir une adresse e-mail valide, par exemple nom@domaine.fr.' : undefined
                  }
                  nativeInputProps={{
                    type: 'email',
                    required: true,
                    autoComplete: 'off',
                    value: row.email,
                    onChange: (event) => updateRow(row.id, { email: event.target.value }),
                  }}
                />
              </div>
              {rows.length > 1 && (
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
              )}
            </fieldset>
          ))}

          {status === 'error' && (
            <Alert
              className={fr.cx('fr-mb-2w')}
              severity="error"
              small
              description="Les contacts n'ont pas pu être enregistrés. Veuillez réessayer."
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
                children: 'Enregistrer',
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
