import dayjs from 'dayjs'
import styles from './scenario-card.module.css'

interface SimulationDateProps {
  createdAt: Date | string
  updatedAt: Date | string
}

export function SimulationDate({ createdAt, updatedAt }: SimulationDateProps) {
  const isUpdated = dayjs(updatedAt).valueOf() !== dayjs(createdAt).valueOf()

  return (
    <p className={styles.dateText}>
      {isUpdated ? `Modifié le ${dayjs(updatedAt).format('DD/MM/YYYY')}` : `Créé le ${dayjs(createdAt).format('DD/MM/YYYY')}`}
    </p>
  )
}
