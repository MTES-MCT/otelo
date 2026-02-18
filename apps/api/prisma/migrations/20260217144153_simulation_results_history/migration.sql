-- AlterTable
ALTER TABLE "simulation_results" ADD COLUMN     "bad_quality" JSONB,
ADD COLUMN     "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "financial_inadequation" JSONB,
ADD COLUMN     "flow_data_by_year" JSONB,
ADD COLUMN     "flow_totals" JSONB,
ADD COLUMN     "hosted" JSONB,
ADD COLUMN     "no_accomodation" JSONB,
ADD COLUMN     "physical_inadequation" JSONB,
ADD COLUMN     "postpeak_total_stock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "prepeak_total_stock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "secondary_accommodation" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sitadel_data" JSONB,
ADD COLUMN     "total" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "simulation_results_history" (
    "id" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "results_json" JSONB NOT NULL,

    CONSTRAINT "simulation_results_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "simulation_results_history_simulation_id_calculated_at_idx" ON "simulation_results_history"("simulation_id", "calculated_at");

-- AddForeignKey
ALTER TABLE "simulation_results_history" ADD CONSTRAINT "simulation_results_history_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
