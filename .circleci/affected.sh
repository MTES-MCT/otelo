#!/usr/bin/env bash
# Dit si les jobs d'une zone (api | web) doivent tourner sur ce pipeline.
#
# Sortie 0 : exécuter le job. Sortie 1 : aucun fichier concerné, le job s'arrête en succès
# (`circleci-agent step halt`), ce qui garde le statut GitHub de chaque job.
# Dans le doute, on exécute : branche d'intégration, base introuvable, fichier hors
# des zones connues, `CI_FULL=true` dans les variables du projet ou `[ci full]` dans
# le message du dernier commit.
set -uo pipefail

area=${1:-}
run() { echo "→ ${area} : exécution, $1"; exit 0; }
skip() { echo "→ ${area} : job sauté, $1"; exit 1; }

case "$area" in
  api | web) ;;
  *) run "zone inconnue « ${area} »" ;;
esac

[ "${CI_FULL:-}" = true ] && run 'CI_FULL=true'
case "${CIRCLE_BRANCH:-}" in
  '' | dev | main) run "branche d'intégration (${CIRCLE_BRANCH:-aucune})" ;;
esac
git log -1 --format=%B | grep -qF '[ci full]' && run '[ci full] dans le message du commit'

# La comparaison porte sur toute la branche depuis dev, pas sur le seul dernier push.
git fetch --quiet origin +refs/heads/dev:refs/remotes/origin/dev || run 'origin/dev injoignable'
base=$(git merge-base HEAD origin/dev) || run 'aucune base commune avec dev'

# --no-renames : un déplacement compte pour son ancien et son nouveau chemin.
mapfile -d '' files < <(git diff -z --no-renames --name-only "$base" HEAD)
[ ${#files[@]} -eq 0 ] && run 'aucune différence avec dev'

matched=''
for f in "${files[@]}"; do
  case "$f" in
    apps/api/*) [ "$area" = api ] && matched=$f ;;
    apps/web/*) [ "$area" = web ] && matched=$f ;;
    docs/* | README.md) ;;
    *) run "fichier partagé modifié : $f" ;;
  esac
done

[ -n "$matched" ] && run "apps/${area} modifié (ex. ${matched})"
skip "${#files[@]} fichier(s) modifié(s) depuis ${base:0:9}, aucun dans apps/${area} ni partagé"
