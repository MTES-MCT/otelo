// DSFR Color System - using official DSFR color tokens
// Reference: https://www.systeme-de-design.gouv.fr/elements-d-interface/fondamentaux-techniques/couleurs-palette

export const dsfrColors = {
  // Blue France
  blueFranceMain525: '#6a6af4', // --blue-france-main-525
  blueFranceSun113: '#000091', // --blue-france-sun-113-625
  blueFrance850: '#cacafb', // --blue-france-850-200
  blueFrance975: '#f5f5fe', // --blue-france-975-75

  // Red Marianne
  redMarianneMain472: '#e1000f', // --red-marianne-main-472
  redMarianne850: '#fcbfbf', // --red-marianne-850-200

  // Green Bourgeon
  greenBourgeonMain640: '#68a532', // --green-bourgeon-main-640
  greenBourgeon850: '#95e257', // --green-bourgeon-850-200

  // Green Emeraude
  greenEmeraudeMain632: '#00a95f', // --green-emeraude-main-632
  greenEmeraude850: '#6fe49d', // --green-emeraude-850-200

  // Green Menthe
  greenMentheMain548: '#009081', // --green-menthe-main-548
  greenMenthe850: '#73e0cf', // --green-menthe-850-200

  // Green Archipel
  greenArchipelMain557: '#009099', // --green-archipel-main-557
  greenArchipel850: '#60e0eb', // --green-archipel-850-200

  // Green Tilleul Verveine
  greenTilleulVerveineMain707: '#b7a73f', // --green-tilleul-verveine-main-707
  greenTilleulVerveine850: '#e2cf58', // --green-tilleul-verveine-850-200

  // Blue Ecume
  blueEcumeMain400: '#465f9d', // --blue-ecume-main-400
  blueEcume850: '#bfccfb', // --blue-ecume-850-200

  // Blue Cumulus
  blueCumulusMain526: '#417dc4', // --blue-cumulus-main-526
  blueCumulus850: '#b6cffb', // --blue-cumulus-850-200

  // Purple Glycine
  purpleGlycineMain494: '#a558a0', // --purple-glycine-main-494
  purpleGlycine850: '#fbb8f6', // --purple-glycine-850-200

  // Pink Macaron
  pinkMacaronMain689: '#e18b76', // --pink-macaron-main-689
  pinkMacaron850: '#fcc0b4', // --pink-macaron-850-200

  // Pink Tuile
  pinkTuileMain556: '#ce614a', // --pink-tuile-main-556
  pinkTuile850: '#fcbfb7', // --pink-tuile-850-200

  // Yellow Tournesol
  yellowTournesolMain731: '#c8aa39', // --yellow-tournesol-main-731
  yellowTournesol850: '#efcb3a', // --yellow-tournesol-850-200

  // Yellow Moutarde
  yellowMoutardeMain679: '#c3992a', // --yellow-moutarde-main-679
  yellowMoutarde850: '#fcc63a', // --yellow-moutarde-850-200

  // Orange Terre Battue
  orangeTerreBattueMain645: '#e4794a', // --orange-terre-battue-main-645
  orangeTerreBattue850: '#fcc0b0', // --orange-terre-battue-850-200

  // Brown Cafe Creme
  brownCafeCremeMain782: '#d1b781', // --brown-cafe-creme-main-782
  brownCafeCreme850: '#e7ca8e', // --brown-cafe-creme-850-200

  // Brown Caramel
  brownCaramelMain648: '#c08c65', // --brown-caramel-main-648
  brownCaramel850: '#eac7b2', // --brown-caramel-850-200

  // Brown Opera
  brownOperaMain680: '#bd987a', // --brown-opera-main-680
  brownOpera850: '#eac7ad', // --brown-opera-850-200

  // Beige Gris Galet
  beigeGrisGaletMain702: '#aea397', // --beige-gris-galet-main-702
  beigeGrisGalet850: '#e0cab0', // --beige-gris-galet-850-200

  // Grey
  grey50: '#161616', // --grey-50-1000
  grey425: '#666', // --grey-425-625
  grey625: '#929292', // --grey-625-425
} as const

// Legacy alias for backwards compatibility
export const dsfrRealColors = {
  blueFrance: dsfrColors.blueFranceMain525,
  blueFranceSun: dsfrColors.blueFranceSun113,
  lightBlueFrance: dsfrColors.blueFrance850,
  redMarianne: dsfrColors.redMarianneMain472,
  greenBourgeon: dsfrColors.greenBourgeonMain640,
  blueEcume: dsfrColors.blueEcumeMain400,
  purpleGlycine: dsfrColors.purpleGlycineMain494,
  pinkMacaron: dsfrColors.pinkMacaronMain689,
  yellowTournesol: dsfrColors.yellowTournesol850,
  orangeTerreBattue: dsfrColors.orangeTerreBattueMain645,
  brownCafeCreme: dsfrColors.brownCafeCremeMain782,
  beigeGrisGalet: dsfrColors.beigeGrisGaletMain702,
  greenEmeraude: dsfrColors.greenEmeraudeMain632,
  blueCumulus: dsfrColors.blueCumulusMain526,
  greenArchipel: dsfrColors.greenArchipelMain557,
  greenTilleulVerveine: dsfrColors.greenTilleulVerveineMain707,
  brownOpera: dsfrColors.brownOperaMain680,
  pinkTuile: dsfrColors.pinkTuileMain556,
  yellowMoutarde: dsfrColors.yellowMoutardeMain679,
  brownCaramel: dsfrColors.brownCaramelMain648,
  greenMenthe: dsfrColors.greenMentheMain548,
} as const

export const barChartColors = [
  dsfrColors.blueFranceMain525,
  dsfrColors.blueEcumeMain400,
  dsfrColors.blueCumulusMain526,
  dsfrColors.greenBourgeonMain640,
  dsfrColors.purpleGlycineMain494,
  dsfrColors.yellowTournesolMain731,
]

export const dsfrHighlightColors = [
  dsfrRealColors.greenBourgeon,
  dsfrRealColors.blueEcume,
  dsfrRealColors.purpleGlycine,
  dsfrRealColors.pinkMacaron,
  dsfrRealColors.yellowTournesol,
  dsfrRealColors.orangeTerreBattue,
  dsfrRealColors.brownCafeCreme,
  dsfrRealColors.beigeGrisGalet,
  dsfrRealColors.greenEmeraude,
  dsfrRealColors.blueCumulus,
  dsfrRealColors.greenArchipel,
  dsfrRealColors.greenTilleulVerveine,
  dsfrRealColors.brownOpera,
  dsfrRealColors.pinkTuile,
  dsfrRealColors.yellowMoutarde,
  dsfrRealColors.brownCaramel,
  dsfrRealColors.greenMenthe,
] as const

export const chartKeyColors = {
  noAccommodation: dsfrRealColors.beigeGrisGalet,
  financialInadequation: dsfrRealColors.yellowTournesol,
  physicalInadequation: dsfrRealColors.blueEcume,
  hosted: dsfrRealColors.pinkMacaron,
  badQuality: dsfrRealColors.brownCafeCreme,

  demographicEvolution: dsfrRealColors.blueFrance,
  renewalNeeds: dsfrRealColors.purpleGlycine,
  secondaryResidenceAccomodationEvolution: dsfrRealColors.brownCafeCreme,
  longTermVacantAccomodation: dsfrRealColors.greenEmeraude,
  shortTermVacantAccomodation: dsfrRealColors.pinkMacaron,
  totalFlux: dsfrRealColors.orangeTerreBattue,

  nbLogVac2Less: dsfrRealColors.greenEmeraude,
  nbLogVac2More: dsfrRealColors.redMarianne,

  secondaryAccommodation: dsfrRealColors.greenArchipel,
  vacant: dsfrRealColors.yellowMoutarde,

  centralB: dsfrRealColors.blueFrance,
  centralC: dsfrRealColors.greenEmeraude,
  centralH: dsfrRealColors.greenBourgeon,

  pbB: dsfrRealColors.blueEcume,
  pbC: dsfrRealColors.greenMenthe,
  pbH: dsfrRealColors.greenTilleulVerveine,

  phB: dsfrRealColors.blueCumulus,
  phC: dsfrRealColors.greenArchipel,
  phH: dsfrRealColors.yellowMoutarde,

  '2010-2015': dsfrRealColors.blueEcume,
  '2015-2021': dsfrRealColors.blueCumulus,
  '2014-2019': dsfrRealColors.greenMenthe,
  '2019-2024': dsfrRealColors.greenArchipel,

  basse: dsfrRealColors.blueEcume,
  central: dsfrRealColors.blueFrance,
  haute: dsfrRealColors.blueCumulus,

  authorizedHousing: dsfrRealColors.yellowTournesol,
  startedHousing: dsfrRealColors.lightBlueFrance,
  housingNeeds: dsfrRealColors.blueFrance,
  surplusHousing: dsfrRealColors.greenBourgeon,

  // Flow requirements donut charts
  evolutionDemographiqueDonut: '#5C68E5',
  residencesSecondairesDonut: '#29598F',
  fluiditeDuParc: '#AEB5FF',
  remobilisationVacants: '#5ABD88',
  renouvellementUrbain: '#18666B',
  logementsSupplementaires: '#E8E8E8',
} as const

export const getChartColor = (chartKey: keyof typeof chartKeyColors): string => {
  return chartKeyColors[chartKey] || dsfrRealColors.blueFrance
}
