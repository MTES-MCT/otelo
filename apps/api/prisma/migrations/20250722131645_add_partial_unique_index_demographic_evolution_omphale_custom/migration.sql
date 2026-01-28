-- CreateIndex
CREATE UNIQUE INDEX "idx_demographic_evolution_omphale_custom_epci_null_scenario" ON "demographic_evolution_omphale_custom"("epci_code") WHERE "scenario_id" IS NULL;