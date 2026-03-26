import Button from '@codegouvfr/react-dsfr/Button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tester mes connaissances - Otelo',
}

export default function TesterMesConnaissancesPage() {
  return (
    <>
      <h1>Tester mes connaissances</h1>
      <p>Vous souhaitez savoir si vous maîtrisez bien l'outil ?</p>
      <p>Répondez à quelques questions pour évaluer votre niveau de connaissance d'Otelo.</p>
      <p>En fonction de vos réponses, nous vous proposerons les ressources les plus adaptées :</p>
      <ul className="fr-mb-4w">
        <li>tutoriels pour débuter</li>
        <li>fiches méthodologiques pour approfondir</li>
        <li>formations et webinaires</li>
      </ul>
      <Button
        size="large"
        linkProps={{
          href: 'https://tally.so/r/wbbOG6',
          target: '_blank',
          rel: 'noopener noreferrer',
        }}
      >
        Lancer le questionnaire
      </Button>
    </>
  )
}
