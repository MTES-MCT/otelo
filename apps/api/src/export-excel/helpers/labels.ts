export const getPopulationLabel = (scenario: string) => {
  switch (scenario) {
    case 'Central_B':
      return 'Central'
    case 'Central_C':
      return 'Central'
    case 'Central_H':
      return 'Central'
    case 'PB_B':
      return 'Basse'
    case 'PB_C':
      return 'Basse'
    case 'PB_H':
      return 'Basse'
    case 'PH_B':
      return 'Haute'
    case 'PH_C':
      return 'Haute'
    case 'PH_H':
      return 'Haute'
  }
}

export const getMenagesLabel = (scenario: string) => {
  switch (scenario) {
    case 'Central_B':
      return 'Décélération'
    case 'Central_C':
      return 'Tendanciel'
    case 'Central_H':
      return 'Accélération'
    case 'PB_B':
      return 'Décélération'
    case 'PB_C':
      return 'Tendanciel'
    case 'PB_H':
      return 'Accélération'
    case 'PH_B':
      return 'Décélération'
    case 'PH_C':
      return 'Tendanciel'
    case 'PH_H':
      return 'Accélération'
  }
}

export const getPopulationKey = (scenario: string) => {
  switch (scenario) {
    case 'Central_B':
      return 'central'
    case 'Central_C':
      return 'central'
    case 'Central_H':
      return 'central'
    case 'PH_B':
      return 'haute'
    case 'PH_C':
      return 'haute'
    case 'PH_H':
      return 'haute'
    case 'PB_B':
      return 'basse'
    case 'PB_C':
      return 'basse'
    case 'PB_H':
      return 'basse'
  }
}

export const getOmphaleKey = (scenario: string) => {
  switch (scenario) {
    case 'Central_B':
      return 'centralB'
    case 'Central_C':
      return 'centralC'
    case 'PH_B':
      return 'phB'
    case 'PH_C':
      return 'phC'
    case 'PH_H':
      return 'phH'
    case 'PB_B':
      return 'pbB'
    case 'PB_C':
      return 'pbC'
    case 'PB_H':
      return 'pbH'
  }
}

export const getSource = (key: string, isBadQuality?: boolean) => {
  switch (key) {
    case 'Filo':
      return isBadQuality ? 'PPPI Noyau dur (CGDD/SDES à partir de données fiscales)' : 'CGDD/SDES'
    case 'FF':
      return 'Fichiers Fonciers'
    case 'RP':
      return 'INSEE'
    case 'SNE':
      return "Système National d'Enregistrement"
  }
}

export const getNoAccommodationLabel = (key: string) => {
  switch (key) {
    case 'autreCentre':
      return "Autre centre d'accueil"
    case 'centreProvisoire':
      return 'Centre provisoire hébergement'
    case 'demandeAsile':
      return "Centre d'accueil demandeur d'asile"
    case 'foyerMigrants':
      return 'Foyer travailleurs migrants'
    case 'horsMaisonRelai':
      return 'Résidences sociale hors Maisons Relais'
    case 'jeuneTravailleur':
      return 'Foyer jeunes travailleurs'
    case 'maisonRelai':
      return 'Maisons relais - pensions'
    case 'malade':
      return 'Hébergement familles malades'
    case 'reinsertion':
      return "Centre d'hébergement réinsertion sociale"
  }
}

export const getHostedLabel = (temporary: boolean, particulier: boolean) => {
  if (temporary && particulier) {
    return 'Logés chez un particulier - Logés temporairement'
  }
  if (particulier) {
    return 'Logés chez un particulier'
  }
  if (temporary) {
    return 'Logés temporairement'
  }
  return null
}

export const getBadHousingCategoryLabel = (loc: boolean, acc: boolean) => {
  if (loc && acc) {
    return 'Propriétaire - Locataires du parc privé'
  }
  if (acc) {
    return 'Propriétaire'
  }
  if (loc) {
    return 'Locataires du parc privé'
  }
  return null
}

export const getSurroccLabel = (key: string) => {
  switch (key) {
    case 'Acc':
      return 'Suroccupation accentuée'
    case 'AccMod':
      return 'Suroccupation modérée et accentuée'
  }
}
