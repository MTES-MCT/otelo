'use client'

import Tag from '@codegouvfr/react-dsfr/Tag'
import { FC } from 'react'
import { tss } from 'tss-react'
import { useEpcis } from '~/hooks/use-epcis'

export const ValidationSettingsInputEpci: FC = () => {
  const { data: epcis } = useEpcis()
  const { classes } = useStyles()

  return (
    <div className={classes.container}>
      <div className={classes.gridContainer}>
        {(epcis || []).map((e) => (
          <Tag key={e.code} iconId="fr-icon-checkbox-circle-line">
            {e.name}
          </Tag>
        ))}
      </div>
    </div>
  )
}

const useStyles = tss.create({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
  },
})
