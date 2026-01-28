export const barChartColors = ['#6a6af4', '#465f9d', '#417dc4', '#68a532', '#a558a0', '#c8aa39']

export const dsfrRealColors = {
  blueFrance: '#6a6af4',
  redMarianne: '#e1000f',
  greenBourgeon: '#68a532',
  blueEcume: '#465f9d',
  purpleGlycine: '#a558a0',
  pinkMacaron: '#e18b76',
  yellowTournesol: '#c8aa39',
  orangeTerreBattue: '#e4794a',
  brownCafeCreme: '#d1b781',
  beigeGrisGalet: '#aea397',
  greenEmeraude: '#00a95f',
  blueCumulus: '#417dc4',
  greenArchipel: '#009099',
  greenTilleulVerveine: '#b7a73f',
  brownOpera: '#bd987a',
  pinkTuile: '#ce614a',
  yellowMoutarde: '#c3992a',
  brownCaramel: '#c08c65',
  greenMenthe: '#009081',
} as const

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

  sitadelValue: dsfrRealColors.blueEcume,
  housingNeeds: dsfrRealColors.pinkTuile,
  surplusHousing: dsfrRealColors.brownCafeCreme,
} as const

export const getChartColor = (chartKey: keyof typeof chartKeyColors): string => {
  return chartKeyColors[chartKey] || dsfrRealColors.blueFrance
}
