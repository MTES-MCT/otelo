/*
  Warnings:

  - You are about to drop the column `demographic_evolution_omphale_custom_id` on the `scenarios` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[epci_code,scenario_id]` on the table `demographic_evolution_omphale_custom` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "scenarios" DROP CONSTRAINT "scenarios_demographic_evolution_omphale_custom_id_fkey";

-- AlterTable
ALTER TABLE "demographic_evolution_omphale_custom" ADD COLUMN     "scenario_id" TEXT;

-- AlterTable
ALTER TABLE "scenarios" DROP COLUMN "demographic_evolution_omphale_custom_id";

-- CreateIndex
CREATE UNIQUE INDEX "demographic_evolution_omphale_custom_epci_code_scenario_id_key" ON "demographic_evolution_omphale_custom"("epci_code", "scenario_id");

-- AddForeignKey
ALTER TABLE "demographic_evolution_omphale_custom" ADD CONSTRAINT "demographic_evolution_omphale_custom_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
