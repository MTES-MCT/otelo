-- Les projections personnalisées étaient uniques par (EPCI, scénario) sans tenir compte
-- du propriétaire : deux utilisateurs ne pouvaient pas travailler sur le même EPCI, et le
-- service tombait sur la ligne d'un autre en cherchant une ligne existante.
--
-- Élargir une clé unique n'autorise que davantage de lignes : l'opération ne peut pas
-- échouer sur des données existantes.
DROP INDEX IF EXISTS "idx_demographic_evolution_omphale_custom_epci_null_scenario";

ALTER TABLE "demographic_evolution_omphale_custom"
  DROP CONSTRAINT IF EXISTS "demographic_evolution_omphale_custom_epci_code_scenario_id_key";

CREATE UNIQUE INDEX "demographic_evolution_omphale_custom_user_epci_scenario_key"
  ON "demographic_evolution_omphale_custom"("user_id", "epci_code", "scenario_id");

CREATE UNIQUE INDEX "idx_demographic_evolution_omphale_custom_user_epci_null_scenario"
  ON "demographic_evolution_omphale_custom"("user_id", "epci_code")
  WHERE "scenario_id" IS NULL;
