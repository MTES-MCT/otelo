'use client'

import { useQueryState } from 'nuqs'
import { FC } from 'react'
import { PeakYearHorizonAlert } from './peak-year-horizon-alert'

export const CreatePeakYearHorizonAlert: FC = () => {
  const [peakYear] = useQueryState('peakYear')
  const [projection] = useQueryState('projection')

  return <PeakYearHorizonAlert peakYear={peakYear ? Number(peakYear) : null} projection={projection ? Number(projection) : null} />
}
