import { DocurbaEpciData } from '~/hooks/use-docurba-epcis'
import { TPlanningDocumentType } from '~/schemas/epci-group'

/** Valeurs du paramètre d'URL `urbanismeDocType`, posé quand l'utilisateur répond « oui ». */
export const URBANISME_DOC_TYPES = ['plh-plui', 'scot', 'autres'] as const
export type UrbanismeDocType = (typeof URBANISME_DOC_TYPES)[number]

export const parseUrbanismeDocType = (value: string | null): UrbanismeDocType | null =>
  URBANISME_DOC_TYPES.includes(value as UrbanismeDocType) ? (value as UrbanismeDocType) : null

/** L'URL est en kebab-case, l'enum Prisma ne peut pas l'être : la correspondance vit ici. */
const PLANNING_DOCUMENT_TYPES: Record<UrbanismeDocType, TPlanningDocumentType> = {
  'plh-plui': 'PLH_PLUI',
  scot: 'SCOT',
  autres: 'AUTRES',
}

/** Traduit le paramètre d'URL en valeur persistée. `null` tant que le type n'est pas désigné. */
export const parsePlanningDocumentType = (urbanismeDocType: string | null): TPlanningDocumentType | null => {
  const docType = parseUrbanismeDocType(urbanismeDocType)
  return docType ? PLANNING_DOCUMENT_TYPES[docType] : null
}

/** Nom du document, conservé pour le seul type qui en porte un. */
export const parsePlanningDocumentName = (urbanismeDocType: string | null, urbanismeDocName: string | null): string | null =>
  parseUrbanismeDocType(urbanismeDocType) === 'plh-plui' ? urbanismeDocName?.trim() || null : null

type BuildEpciGroupNameArgs = {
  territoryLabel: string
  /** Nom du bassin d'habitat, seul retenu pour nommer un SCoT. Absent en sélection personnalisée. */
  bassinName?: string | null
  worksOnUrbanismeDoc: boolean
  docType: UrbanismeDocType | null
  /** Document choisi dans la liste Docurba, ou saisi librement. */
  docName?: string | null
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
  bassinName ? `${bassinName} - ${baseEpciName}` : baseEpciName

/**
 * Nom proposé pour le groupe d'EPCI. La chaîne vide est un résultat valide : sur « Autres », aucun
 * nom n'est proposé et l'utilisateur saisit le sien.
 */
export const buildEpciGroupName = ({
  territoryLabel,
  bassinName,
  worksOnUrbanismeDoc,
  docType,
  docName,
  docurba,
}: BuildEpciGroupNameArgs): string => {
  if (!worksOnUrbanismeDoc) return territoryLabel

  if (docType === 'plh-plui') return docName?.trim() ?? ''

  if (docType === 'scot') {
    // Sans bassin d'habitat (sélection personnalisée), on retombe sur le SCoT trouvé sur Docurba.
    if (bassinName) return `SCoT ${bassinName}`
    if (docurba?.scotName) return docurba.scotName
    return `SCoT ${territoryLabel}`
  }

  return ''
}
