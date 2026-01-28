'use client'

import { ToggleSwitch } from '@codegouvfr/react-dsfr/ToggleSwitch'
import { parseAsBoolean, useQueryState } from 'nuqs'

export const SimulationSettingsPresentationMode = () => {
  const [presentationMode, setPresentationMode] = useQueryState('presentation', parseAsBoolean)

  return (
    <ToggleSwitch
      labelPosition="left"
      label="Mode présentation"
      checked={!!presentationMode}
      showCheckedHint={false}
      onChange={(checked) => setPresentationMode(checked)}
    />
  )
}
