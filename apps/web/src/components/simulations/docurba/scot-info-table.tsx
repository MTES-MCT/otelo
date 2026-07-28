'use client'

import { ReactNode } from 'react'
import { DocurbaEpciData, useDocurbaEpcis } from '~/hooks/use-docurba-epcis'

type Props = {
  epcis: Array<{ code: string; name: string }>
  /** Sans l'encadré `fr-callout` ni le titre, pour un affichage dans un conteneur qui les porte déjà (drawer, modale…) */
  bare?: boolean
}

export const ScotInfoTable = ({ epcis, bare = false }: Props) => {
  const { data, isLoading, isFetching } = useDocurbaEpcis(epcis.map((e) => e.code))

  const rows = epcis.map((epci) => ({ epci, data: data?.[epci.code] ?? null }))
  const hasAnyData = rows.some((r) => r.data?.documentType || r.data?.scotName)
  // Un EPCI encore `null` pendant un rafraîchissement est en attente, pas dépourvu de données
  const isPending = (epciData: DocurbaEpciData | null) => !epciData && isFetching

  const wrapMessage = (message: ReactNode) =>
    bare ? (
      <p className="fr-text-default--grey fr-text--sm fr-mb-0">{message}</p>
    ) : (
      <div className="fr-callout fr-callout--blue-ecume">
        <p className="fr-callout__text fr-text-default--grey fr-text--sm">{message}</p>
      </div>
    )

  if (isLoading || (!hasAnyData && isFetching)) {
    return wrapMessage(
      <>
        <span aria-hidden="true" className="fr-docurba-spinner fr-mr-1v" />
        Chargement des documents d&apos;urbanisme…
      </>,
    )
  }

  if (!hasAnyData) {
    return wrapMessage("Aucun document d'urbanisme trouvé sur Docurba pour ce territoire.")
  }

  return (
    <div className={bare ? undefined : 'fr-callout fr-callout--blue-ecume'}>
      {!bare && <h4 className="fr-callout__title fr-text--md">Planification territoriale</h4>}
      <div className={bare ? undefined : 'fr-callout__text'}>
        <div className="fr-table fr-table--sm fr-table--no-caption fr-mb-0">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th scope="col">EPCI</th>
                <th scope="col">Document d&apos;urbanisme</th>
                <th scope="col">SCoT</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ epci, data: epciData }) => (
                <tr key={epci.code}>
                  <td className="fr-text--bold">{epci.name}</td>
                  <td>
                    {epciData?.documentType ? (
                      <>
                        {epciData.documentType}
                        {epciData.approvalYear && <span className="fr-text-default--grey"> ({epciData.approvalYear})</span>}
                        {epciData.procedureInProgress && (
                          <span className="fr-badge fr-badge--sm fr-badge--info fr-ml-1v">{epciData.procedureInProgress.type}</span>
                        )}
                      </>
                    ) : isPending(epciData) ? (
                      <span aria-hidden="true" className="fr-docurba-spinner" />
                    ) : (
                      <span className="fr-text-default--grey">—</span>
                    )}
                  </td>
                  <td>{epciData?.scotName ?? <span className="fr-text-default--grey">{isPending(epciData) ? '' : '—'}</span>}</td>
                  <td>
                    {epciData?.communeCode && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_DOCURBA_BASE_URL}/collectivites/${epciData.communeCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fr-link fr-link--icon-right fr-icon-external-link-line fr-text--sm"
                      >
                        Docurba
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
