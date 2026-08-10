import { WizardStepSlug } from '~/components/simulations/settings/wizard-steps'
import { GUIDE_URL } from '~/utils/resources'

/**
 * Questions récurrentes affichées dans la colonne latérale du parcours.
 *
 * Les libellés reprennent les interrogations déjà formulées dans le mode tuto
 * (`tutorial/tutorial-content.ts`), mais renvoient vers les sections du guide plutôt que vers des
 * bulles : l'utilisateur veut ici approfondir, pas être guidé pas à pas.
 *
 * `anchor` est l'`id` d'un titre de `app/(unauthenticated)/(generic-pages)/guide/page.tsx`.
 * L'étape « choix du territoire » n'y figure pas : la colonne ne s'y affiche pas.
 */
export type StepQuestion = {
  label: string
  anchor: string
}

export const STEP_QUESTIONS: Partial<Record<WizardStepSlug, StepQuestion[]>> = {
  'cadrage-temporel': [
    { label: 'À quelle date estimer le besoin ?', anchor: 'hypotheses-calcul-incontournables' },
    { label: "Qu'est-ce que le millésime ?", anchor: 'donnees-demarrer' },
    { label: 'Que se passe-t-il si les ménages diminuent ?', anchor: 'otelo-fait' },
  ],

  'parametrages-demographique': [
    { label: "D'où viennent ces projections ?", anchor: 'projections-population' },
    { label: '« Population basse », est-ce une perte d’habitants ?', anchor: 'projections-population' },
    { label: 'Qu’est-ce que la décohabitation ?', anchor: 'projections-menages' },
    { label: 'Comment ces projections sont-elles élaborées ?', anchor: 'elaboration-projections' },
  ],

  'taux-cibles-logements-vacants': [
    { label: 'Quels logements vacants sont remobilisables ?', anchor: 'vacance-longue-duree-parametrage' },
    { label: 'Pourquoi la vacance de courte durée est-elle figée ?', anchor: 'vacance-courte-duree' },
    { label: 'Un taux qui baisse, est-ce un volume qui baisse ?', anchor: 'vacance-longue-duree-parametrage' },
  ],

  'taux-cibles-residences-secondaires': [
    { label: 'Dans quel sens joue ce taux ?', anchor: 'residences-secondaires-parametrage' },
    { label: "D'où vient la valeur par défaut ?", anchor: 'donnees-parc-logement' },
    { label: 'Un taux qui baisse, est-ce un volume qui baisse ?', anchor: 'residences-secondaires-parametrage' },
  ],

  'taux-restructuration-disparition': [
    { label: 'Qu’est-ce qu’une restructuration ?', anchor: 'taux-restructuration' },
    { label: 'Qu’est-ce qu’une disparition ?', anchor: 'taux-disparition' },
    { label: 'Faut-il reconduire les taux observés ?', anchor: 'taux-restructuration' },
  ],
}

export const buildGuideHref = (anchor: string): string => `${GUIDE_URL}#${anchor}`
