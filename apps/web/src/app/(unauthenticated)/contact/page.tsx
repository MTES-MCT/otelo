import { fr } from '@codegouvfr/react-dsfr'
import type { Metadata } from 'next'
import { ContactForm } from '~/components/contact/contact-form'
import { CONTACT_EMAIL } from '~/utils/resources'

export const metadata: Metadata = {
  title: 'Contacter Otelo',
}

export default function ContactPage() {
  return (
    <div className={fr.cx('fr-container', 'fr-p-md-4w')} style={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}>
      <h1>Contactez-nous</h1>

      <div className={fr.cx('fr-mb-4w')}>
        <h2>Nous contacter par e-mail</h2>
        <p>
          Vous pouvez nous contacter par e-mail à l&apos;adresse suivante : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> ou en
          utilisant le formulaire ci-dessous.
        </p>
      </div>
      <h3>Formulaire de contact</h3>
      <p>
        Les champs marqués d&apos;un <span aria-hidden="true">*</span> sont obligatoires.
      </p>
      <ContactForm />
    </div>
  )
}
