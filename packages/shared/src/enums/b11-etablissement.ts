export const B11Etablissement = {
  autreCentre: 'autreCentre',
  demandeAsile: 'demandeAsile',
  reinsertion: 'reinsertion',
  centreProvisoire: 'centreProvisoire',
  jeuneTravailleur: 'jeuneTravailleur',
  foyerMigrants: 'foyerMigrants',
  malade: 'malade',
  maisonRelai: 'maisonRelai',
  horsMaisonRelai: 'horsMaisonRelai',
} as const

export type B11Etablissement = (typeof B11Etablissement)[keyof typeof B11Etablissement]
