-- Avant le bornage de l'horizon de temps, l'interface laissait choisir le millésime lui-même
-- comme année de projection. La période était alors nulle (« 2022 → 2022 ») et tous les besoins
-- calculés valaient zéro. On ramène ces scénarios à la première valeur désormais sélectionnable,
-- soit millésime + 1, qui est le plus petit écart au choix initial de l'utilisateur.
--
-- Les résultats sont recalculés à chaque consultation de la page résultats, mais le tableau de
-- bord lit le cache `simulation_results`. On purge donc le cache des seules simulations
-- retouchées (via RETURNING, pour ne pas viser celles dont millésime + 1 est un choix légitime),
-- ce qui affiche un total absent plutôt qu'un zéro hérité de l'ancienne période.
WITH corriges AS (
  UPDATE "scenarios"
  SET "projection" = "millesime"::int + 1
  WHERE "projection" <= "millesime"::int
  RETURNING "id"
)
DELETE FROM "simulation_results"
WHERE "simulation_id" IN (
  SELECT s."id"
  FROM "simulations" s
  JOIN corriges c ON c."id" = s."scenario_id"
);
