'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Input from '@codegouvfr/react-dsfr/Input'
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { parseUrbanismeDocType, UrbanismeDocType } from '~/utils/epci-group-name'

type UrbanismeDocQuestionProps = {
  /** Affiche les messages d'erreur, une fois « Suivant » sollicité sans réponse. */
  hasError?: boolean
}

export const UrbanismeDocQuestion: FC<UrbanismeDocQuestionProps> = ({ hasError = false }) => {
  const [{ urbanismeDoc, urbanismeDocType, urbanismeDocName }, setQueryStates] = useQueryStates({
    urbanismeDoc: parseAsString,
    urbanismeDocType: parseAsString,
    urbanismeDocName: parseAsString,
  })

  const docType = parseUrbanismeDocType(urbanismeDocType)

  const setUrbanismeDoc = (value: 'oui' | 'non') => setQueryStates({ urbanismeDoc: value, urbanismeDocName: null, urbanismeDocType: null })

  const setUrbanismeDocType = (value: UrbanismeDocType) => setQueryStates({ urbanismeDocName: null, urbanismeDocType: value })

  const isDocTypeMissing = hasError && urbanismeDoc === 'oui' && !docType
  const isDocNameMissing = hasError && docType === 'plh-plui' && !urbanismeDocName?.trim()

  return (
    <>
      <RadioButtons
        // Remontage forcé : DSFR mémorise l'état coché de ses inputs, qui désynchronise sinon de l'URL.
        key={`urbanisme-doc-${urbanismeDoc ?? 'none'}`}
        className={fr.cx('fr-mb-0')}
        legend="Travaillez-vous sur un document d'urbanisme ?"
        hintText="Votre réponse détermine le nom qui vous sera proposé pour ce groupe d'EPCI."
        orientation="horizontal"
        name="urbanisme-doc"
        state={hasError && !urbanismeDoc ? 'error' : 'default'}
        stateRelatedMessage={hasError && !urbanismeDoc ? 'Répondez à cette question pour continuer.' : undefined}
        options={[
          {
            label: 'Oui',
            nativeInputProps: { value: 'oui', checked: urbanismeDoc === 'oui', onChange: () => setUrbanismeDoc('oui') },
          },
          {
            label: 'Non',
            nativeInputProps: { value: 'non', checked: urbanismeDoc === 'non', onChange: () => setUrbanismeDoc('non') },
          },
        ]}
      />

      {urbanismeDoc === 'oui' && (
        <div className={fr.cx('fr-mt-3w')}>
          <RadioButtons
            key={`urbanisme-doc-type-${docType ?? 'none'}`}
            className={fr.cx('fr-mb-0')}
            legend="Sur quel type de document travaillez-vous ?"
            orientation="horizontal"
            name="urbanisme-doc-type"
            state={isDocTypeMissing ? 'error' : 'default'}
            stateRelatedMessage={isDocTypeMissing ? 'Choisissez un type de document pour continuer.' : undefined}
            options={[
              {
                label: 'PLH ou PLUi',
                nativeInputProps: {
                  value: 'plh-plui',
                  checked: docType === 'plh-plui',
                  onChange: () => setUrbanismeDocType('plh-plui'),
                },
              },
              {
                label: 'SCoT',
                nativeInputProps: { value: 'scot', checked: docType === 'scot', onChange: () => setUrbanismeDocType('scot') },
              },
              {
                label: 'Autres',
                nativeInputProps: { value: 'autres', checked: docType === 'autres', onChange: () => setUrbanismeDocType('autres') },
              },
            ]}
          />

          {docType === 'plh-plui' && (
            <div className={fr.cx('fr-mt-3w')}>
              <Input
                label="Nom du document"
                hintText="Saisissez le nom du document tel qu’il est utilisé sur votre territoire."
                state={isDocNameMissing ? 'error' : 'default'}
                stateRelatedMessage={isDocNameMissing ? 'Saisissez le nom du document pour continuer.' : undefined}
                nativeInputProps={{
                  value: urbanismeDocName ?? '',
                  onChange: (e) => setQueryStates({ urbanismeDocName: e.target.value }),
                  placeholder: 'Ex : PLH de la Communauté d’agglomération du Libournais',
                }}
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}
