export interface PageInfo {
  hasPreviousPage: boolean
  hasNextPage: boolean
  startCursor: string
  endCursor: string
}

export interface Usager {
  email: string
}

export interface TextChamp {
  id: string
  label: string
  value: string
}

export interface RepetitionChamp {
  id: string
  label: string
  champs: TextChamp[]
}

export interface Champ {
  id: string
  label: string
  value?: string
  champs?: TextChamp[]
}

export interface DossierNode {
  id: string
  state: string
  dateDepot: string
  dateDerniereModification: string
  usager: Usager
  champs: Champ[]
}

export interface DossiersResponse {
  pageInfo: PageInfo
  nodes: DossierNode[]
}

export interface Demarche {
  id: string
  title: string
  dossiers: DossiersResponse
}

export interface GraphQLResponse {
  data: {
    demarche: Demarche
  }
}
