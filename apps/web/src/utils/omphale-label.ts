export const formatScenario = (scenario: string, lowercase = false): string => {
  let formatted = ''

  if (scenario === 'Central') {
    formatted = 'Central'
  } else if (scenario === 'PB') {
    formatted = 'Basse'
  } else if (scenario === 'PH') {
    formatted = 'Haute'
  }

  return lowercase ? formatted.toLowerCase() : formatted
}

export const formatDecohabitation = (decohabitation: string, lowercase = false): string => {
  let formatted = ''

  if (decohabitation === 'H') {
    formatted = 'Haute'
  } else if (decohabitation === 'B') {
    formatted = 'Basse'
  } else if (decohabitation === 'C') {
    formatted = 'Tendanciel'
  }

  return lowercase ? formatted.toLowerCase() : formatted
}

export const getOmphaleLabel = (value: string | null): string | null => {
  if (!value) return null

  const scenario = value.split('_')[0]
  const decohabitation = value.split('_')[1]

  const formattedScenario = formatScenario(scenario)
  const formattedDecohabitation = formatDecohabitation(decohabitation)

  return `${formattedScenario} - ${formattedDecohabitation}`
}

type PopulationBadge = 'BASSE' | 'CENTRALE' | 'HAUTE'

export const getPopulationBadge = (b2Scenario: string): PopulationBadge => {
  const [population] = b2Scenario.split('_')
  switch (population) {
    case 'PB':
      return 'BASSE'
    case 'PH':
      return 'HAUTE'
    case 'Central':
    default:
      return 'CENTRALE'
  }
}

export const getDecohabitationBadge = (b2Scenario: string): PopulationBadge => {
  const [, decohabitation] = b2Scenario.split('_')
  switch (decohabitation) {
    case 'B':
      return 'BASSE'
    case 'H':
      return 'HAUTE'
    case 'C':
    default:
      return 'CENTRALE'
  }
}
