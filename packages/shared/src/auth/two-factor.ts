/**
 * Longueur du code à usage unique de la seconde authentification.
 *
 * Partagée parce que les deux applications doivent en convenir sans se parler : l'API
 * la donne au plugin better-auth (`otpOptions.digits`) pour engendrer le code, le web
 * en dérive la règle de saisie du formulaire. Deux constantes indépendantes reliées par
 * un commentaire laissaient passer le cas où l'une bouge seule — le formulaire refusait
 * alors tout code valide, sans qu'aucun test ne le voie.
 */
export const TWO_FACTOR_CODE_LENGTH = 6
