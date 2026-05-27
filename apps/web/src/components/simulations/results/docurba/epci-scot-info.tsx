'use client'

import { useDocurbaEpci } from '~/hooks/use-docurba-epci'

type Props = {
  epciCode: string
}

export const EpciScotInfo = ({ epciCode }: Props) => {
  const { data, isLoading } = useDocurbaEpci(epciCode)

  if (isLoading) {
    return (
      <div className="fr-notice fr-notice--info fr-notice--no-icon">
        <div className="fr-container">
          <div className="fr-notice__body">
            <p className="fr-notice__title fr-text-default--grey fr-text--sm fr-flex fr-align-items-center fr-flex-gap-2v">
              <span aria-hidden="true" className="fr-docurba-spinner" />
              Chargement des documents d&apos;urbanisme…
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!data || (!data.scotName && !data.documentType)) {
    return (
      <div className="fr-notice fr-notice--info">
        <div className="fr-container">
          <div className="fr-notice__body">
            <p className="fr-notice__title fr-text-default--grey fr-text--sm">
              Aucun document d&apos;urbanisme trouvé sur Docurba pour cet EPCI.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { communeCode, scotName, documentType, approvalYear, procedureInProgress } = data
  const docurbaUrl = `${process.env.NEXT_PUBLIC_DOCURBA_BASE_URL}/collectivites/${communeCode}`

  return (
    <div className="fr-notice fr-notice--info">
      <div className="fr-container">
        <div className="fr-notice__body fr-flex fr-align-items-center fr-justify-content-space-between">
          <p className="fr-notice__title fr-mb-0">
            {documentType && (
              <span>
                {documentType}
                {approvalYear && <span className="fr-text--regular"> — approuvé en {approvalYear}</span>}
                {procedureInProgress && (
                  <span className="fr-text--regular fr-text-default--grey"> · {procedureInProgress.type} en cours</span>
                )}
              </span>
            )}
            {documentType && scotName && <span className="fr-mx-2v fr-text-default--grey">·</span>}
            {scotName && <span className="fr-text--regular">SCoT&nbsp;: {scotName}</span>}
          </p>
          <a
            href={docurbaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fr-link fr-link--icon-right fr-icon-external-link-line fr-text--sm fr-ml-4v"
            style={{ whiteSpace: 'nowrap' }}
          >
            Voir sur Docurba
          </a>
        </div>
      </div>
    </div>
  )
}
