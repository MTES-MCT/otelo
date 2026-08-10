import { DocurbaEpciData } from '~/hooks/use-docurba-epcis'

type BuildEpciGroupNameArgs = {
  territoryLabel: string
  worksOnUrbanismeDoc: boolean
  /** Données Docurba de l'EPCI de base uniquement : sur un bassin, les autres EPCI peuvent porter d'autres documents. */
  docurba: Pick<DocurbaEpciData, 'scotName' | 'documentType'> | null | undefined
}

/** Traduit le paramètre d'URL `urbanismeDoc` en flag envoyé à l'API. `null` = question non posée. */
export const parseUrbanismeDocAnswer = (urbanismeDoc: string | null): boolean | null => {
  if (urbanismeDoc === 'oui') return true
  if (urbanismeDoc === 'non') return false
  return null
}

export const buildTerritoryLabel = (baseEpciName: string, bassinName?: string | null): string =>
  bassinName ? `Bassin ${bassinName} - ${baseEpciName}` : baseEpciName

export const buildEpciGroupName = ({ territoryLabel, worksOnUrbanismeDoc, docurba }: BuildEpciGroupNameArgs): string => {
  if (!worksOnUrbanismeDoc) return territoryLabel
  if (docurba?.scotName) return docurba.scotName
  if (docurba?.documentType) return `${docurba.documentType} - ${territoryLabel}`
  return territoryLabel
}
