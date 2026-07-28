'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { useState } from 'react'
import { Drawer } from '~/components/common/drawer'
import { ScotInfoTable } from './scot-info-table'

type Props = {
  epcis: Array<{ code: string; name: string }>
  label?: string
}

export const ScotInfoDrawer = ({ epcis, label = 'Voir la planification territoriale' }: Props) => {
  const [isOpen, setIsOpen] = useState(false)

  if (epcis.length === 0) return null

  return (
    <>
      <div className="fr-flex">
        <Button priority="tertiary" iconId="fr-icon-file-text-line" iconPosition="left" size="small" onClick={() => setIsOpen(true)}>
          {label}
        </Button>
      </div>

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Planification territoriale">
        <ScotInfoTable epcis={epcis} bare />
      </Drawer>
    </>
  )
}
