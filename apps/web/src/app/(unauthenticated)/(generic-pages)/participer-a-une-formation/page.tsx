import Button from '@codegouvfr/react-dsfr/Button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Participer à une formation - Otelo',
}

export default function ParticiperAUneFormationPage() {
  return (
    <>
      <h1>Participer à une formation</h1>
      <p>L'équipe Otelo organise régulièrement des webinaires de formation et d'échanges pour accompagner les utilisateurs.</p>
      <p>Ces webinaires permettent de :</p>
      <ul className="fr-mb-4w">
        <li>découvrir l'outil</li>
        <li>approfondir la méthodologie</li>
        <li>poser vos questions</li>
        <li>partager des retours d'expérience</li>
      </ul>
      <Button
        size="large"
        linkProps={{
          href: 'https://tally.so/r/mZy2de',
          target: '_blank',
          rel: 'noopener noreferrer',
        }}
      >
        S'inscrire à un webinaire
      </Button>
    </>
  )
}
