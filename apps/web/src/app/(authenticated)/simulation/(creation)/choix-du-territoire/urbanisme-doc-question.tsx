'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Input from '@codegouvfr/react-dsfr/Input'
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons'
import { Select } from '@codegouvfr/react-dsfr/Select'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { FC, useState } from 'react'
import { RedAsterisk } from '~/components/ui/red-asterisk'
import { collectPlanningDocuments, useDocurbaEpcis } from '~/hooks/use-docurba-epcis'
import { validateUrbanismeDoc } from '~/schemas/urbanisme-doc'
import { parseUrbanismeDocType, UrbanismeDocType } from '~/utils/epci-group-name'

type UrbanismeDocQuestionProps = {
  /** Affiche les messages d'erreur, une fois « Suivant » sollicité sans réponse. */
  hasError?: boolean
  /** Facultative sur un groupe existant, qui porte déjà son nom : pas de marque d'obligation. */
  required?: boolean
}

/** Valeur sentinelle du `Select` : bascule sur la saisie libre, pour les documents absents de Docurba. */
const FREE_TEXT_OPTION = '__autre__'

export const UrbanismeDocQuestion: FC<UrbanismeDocQuestionProps> = ({ hasError = false, required = true }) => {
  const [{ epcis, urbanismeDoc, urbanismeDocType, urbanismeDocName }, setQueryStates] = useQueryStates({
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    urbanismeDoc: parseAsString,
    urbanismeDocType: parseAsString,
    urbanismeDocName: parseAsString,
  })

  const { data: docurbaByEpci, isFetching } = useDocurbaEpcis(epcis)
  const documents = collectPlanningDocuments(docurbaByEpci)

  const docType = parseUrbanismeDocType(urbanismeDocType)

  // « Autre » vide le nom : sans mémoire du choix, le `Select` retomberait aussitôt sur la liste.
  // Au retour depuis une autre étape, un nom absent de la liste suffit à retrouver le mode saisie —
  // à condition que la liste soit arrivée, d'où le garde sur `documents.length`.
  const [isFreeTextSelected, setIsFreeTextSelected] = useState(false)
  const isFreeText = isFreeTextSelected || (!!urbanismeDocName && documents.length > 0 && !documents.includes(urbanismeDocName))
  const selectValue = isFreeText ? FREE_TEXT_OPTION : (urbanismeDocName ?? '')

  const setUrbanismeDoc = (value: 'oui' | 'non') => {
    setIsFreeTextSelected(false)
    return setQueryStates({ urbanismeDoc: value, urbanismeDocName: null, urbanismeDocType: null })
  }

  const setUrbanismeDocType = (value: UrbanismeDocType) => {
    setIsFreeTextSelected(false)
    return setQueryStates({ urbanismeDocName: null, urbanismeDocType: value })
  }

  const onSelectDocument = (value: string) => {
    setIsFreeTextSelected(value === FREE_TEXT_OPTION)
    return setQueryStates({ urbanismeDocName: value === FREE_TEXT_OPTION ? '' : value || null })
  }

  const requiredMark = required && <RedAsterisk />
  // Les erreurs ne s'affichent qu'une fois « Suivant » sollicité : on ne reproche rien avant.
  const errors = hasError ? validateUrbanismeDoc({ urbanismeDoc, urbanismeDocName, urbanismeDocType }) : {}

  return (
    <>
      <RadioButtons
        // Remontage forcé : DSFR mémorise l'état coché de ses inputs, qui désynchronise sinon de l'URL.
        key={`urbanisme-doc-${urbanismeDoc ?? 'none'}`}
        className={fr.cx('fr-mb-0')}
        legend={<>Travaillez-vous sur un document d&apos;urbanisme ? {requiredMark}</>}
        hintText="Votre réponse détermine le nom qui vous sera proposé pour ce groupe d'EPCI."
        orientation="horizontal"
        name="urbanisme-doc"
        state={errors.urbanismeDoc ? 'error' : 'default'}
        stateRelatedMessage={errors.urbanismeDoc}
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
            legend={<>Sur quel type de document travaillez-vous ? {requiredMark}</>}
            orientation="horizontal"
            name="urbanisme-doc-type"
            state={errors.urbanismeDocType ? 'error' : 'default'}
            stateRelatedMessage={errors.urbanismeDocType}
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
              {documents.length > 0 && (
                <Select
                  // `Select` du DSFR n'accepte pas de `hintText` : la précision passe dans le libellé.
                  label={
                    <>Quel document ? (documents intercommunaux recensés par Docurba sur les territoires sélectionnés) {requiredMark}</>
                  }
                  nativeSelectProps={{ value: selectValue, onChange: (e) => onSelectDocument(e.target.value) }}
                  state={errors.urbanismeDocName && !isFreeText ? 'error' : 'default'}
                  stateRelatedMessage={!isFreeText ? errors.urbanismeDocName : undefined}
                >
                  <option value="">Sélectionnez un document</option>
                  {documents.map((document) => (
                    <option key={document} value={document}>
                      {document}
                    </option>
                  ))}
                  <option value={FREE_TEXT_OPTION}>Autre — saisir le nom du document</option>
                </Select>
              )}

              {/* Docurba ne recense aucun PLH : hors PLUi, le nom ne peut venir que de l'utilisateur. */}
              {(documents.length === 0 || isFreeText) && (
                <Input
                  label={<>Nom du document {requiredMark}</>}
                  hintText={
                    documents.length === 0 && isFetching
                      ? 'Recherche des documents en cours…'
                      : 'Saisissez le nom du document tel qu’il est utilisé sur votre territoire.'
                  }
                  state={errors.urbanismeDocName ? 'error' : 'default'}
                  stateRelatedMessage={errors.urbanismeDocName}
                  nativeInputProps={{
                    value: urbanismeDocName ?? '',
                    onChange: (e) => setQueryStates({ urbanismeDocName: e.target.value }),
                    placeholder: 'Ex : PLH de la Communauté d’agglomération du Libournais',
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
