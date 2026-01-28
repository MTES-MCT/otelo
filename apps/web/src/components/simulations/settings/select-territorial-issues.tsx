'use client'

import { FrCxArg, fr } from '@codegouvfr/react-dsfr'
import { useQueryState } from 'nuqs'
import { FC } from 'react'
import { tss } from 'tss-react'

type SelectTerritorialIssueProps = {
  iconId: FrCxArg
  label: string
}

const SelectTerritorialIssue: FC<SelectTerritorialIssueProps> = ({ iconId, label }) => {
  const { classes, cx } = useStyles()
  return (
    <div className={classes.card}>
      <span className={cx(fr.cx(iconId), classes.icon)} />
      <span>{label}</span>
    </div>
  )
}

export const SelectTerritorialIssues: FC = () => {
  const [q] = useQueryState('q')
  const { classes } = useStyles()
  if (!q) return null

  const issues: Array<SelectTerritorialIssueProps> = [
    { iconId: 'ri-windy-line', label: 'Redynamiser le territoire' },
    { iconId: 'ri-water-percent-fill', label: 'Montée des eaux' },
    { iconId: 'ri-home-7-fill', label: 'Mal logement' },
    { iconId: 'ri-briefcase-4-fill', label: 'Vacance' },
    { iconId: 'ri-question-fill', label: 'Autre' },
  ]
  return (
    <div className="fr-mt-4w">
      <h6>Quelles problématiques clés rencontrez-vous sur le territoire ?</h6>

      <div className={classes.container}>
        <div className={classes.firstRow}>
          {[...issues].splice(0, 3).map((issue) => (
            <SelectTerritorialIssue key={issue.label} {...issue} />
          ))}
        </div>
        <div className={classes.secondRow}>
          {[...issues].splice(3, issues.length).map((issue) => (
            <SelectTerritorialIssue key={issue.label} {...issue} />
          ))}
        </div>
      </div>
    </div>
  )
}

const useStyles = tss.create({
  card: {
    '&:hover': {
      backgroundColor: fr.colors.decisions.background.alt.blueFrance.hover,
      borderColor: fr.colors.decisions.background.actionLow.blueFrance.hover,
      'span:last-child': {
        textDecoration: 'underline',
      },
    },
    alignItems: 'center',
    border: '1px solid #E5E5E5',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    height: '12rem',
    justifyContent: 'space-evenly',
    textAlign: 'center',
    width: '10rem',
  },
  container: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '4rem',
    justifyContent: 'center',
  },
  firstRow: {
    display: 'flex',
    gap: '4rem',
  },
  icon: {
    '&::before': {
      '--icon-size': '3rem',
    },
  },
  secondRow: {
    display: 'flex',
    gap: '4rem',
  },
})
