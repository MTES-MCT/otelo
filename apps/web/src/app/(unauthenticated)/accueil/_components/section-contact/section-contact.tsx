import Button from '@codegouvfr/react-dsfr/Button'
import styles from './section-contact.module.css'

export const SectionContact = () => {
  return (
    <section className={styles.section}>
      <Button priority="secondary" size="large" linkProps={{ href: '/contact' }}>
        Nous contacter
      </Button>
    </section>
  )
}
