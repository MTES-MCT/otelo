/*
  Warnings:

  - The primary key for the `bad_quality_filocom` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `demographic_evolution_omphale` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `demographic_evolution_population` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `filocom_flux` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `hosted_filocom` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `household_sizes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `physical_inadequation_filo` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `social_parc` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "social_parc" DROP CONSTRAINT "social_parc_epci_code_fkey";

-- AlterTable
ALTER TABLE "bad_quality_filocom" DROP CONSTRAINT "bad_quality_filocom_pkey",
ADD COLUMN     "millesime" TEXT NOT NULL DEFAULT '2021',
ADD CONSTRAINT "bad_quality_filocom_pkey" PRIMARY KEY ("epci_code", "millesime");

-- AlterTable
ALTER TABLE "demographic_evolution_omphale" DROP CONSTRAINT "demographic_evolution_omphale_pkey",
ADD COLUMN     "millesime" TEXT NOT NULL DEFAULT '2021',
ADD CONSTRAINT "demographic_evolution_omphale_pkey" PRIMARY KEY ("epci_code", "year", "millesime");

-- AlterTable
ALTER TABLE "demographic_evolution_population" DROP CONSTRAINT "demographic_evolution_population_pkey",
ADD COLUMN     "millesime" TEXT NOT NULL DEFAULT '2021',
ADD CONSTRAINT "demographic_evolution_population_pkey" PRIMARY KEY ("epci_code", "year", "millesime");

-- AlterTable
ALTER TABLE "filocom_flux" DROP CONSTRAINT "filocom_flux_pkey",
ADD COLUMN     "millesime" TEXT NOT NULL DEFAULT '2021',
ADD CONSTRAINT "filocom_flux_pkey" PRIMARY KEY ("epci_code", "millesime");

-- AlterTable
ALTER TABLE "hosted_filocom" DROP CONSTRAINT "hosted_filocom_pkey",
ADD COLUMN     "millesime" TEXT NOT NULL DEFAULT '2021',
ADD CONSTRAINT "hosted_filocom_pkey" PRIMARY KEY ("epci_code", "millesime");

-- AlterTable
ALTER TABLE "household_sizes" DROP CONSTRAINT "household_sizes_pkey",
ADD COLUMN     "millesime" TEXT NOT NULL DEFAULT '2021',
ADD CONSTRAINT "household_sizes_pkey" PRIMARY KEY ("epci_code", "year", "millesime");

-- AlterTable
ALTER TABLE "physical_inadequation_filo" DROP CONSTRAINT "physical_inadequation_filo_pkey",
ADD COLUMN     "millesime" TEXT NOT NULL DEFAULT '2021',
ADD CONSTRAINT "physical_inadequation_filo_pkey" PRIMARY KEY ("epci_code", "millesime");

-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN     "millesime" TEXT NOT NULL DEFAULT '2021';

-- DropTable
DROP TABLE "social_parc";

-- CreateTable
CREATE TABLE "data_pack_versions" (
    "millesime" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_pack_versions_pkey" PRIMARY KEY ("millesime")
);

-- CreateIndex
CREATE INDEX "demographic_evolution_omphale_millesime_idx" ON "demographic_evolution_omphale"("millesime");

-- CreateIndex
CREATE INDEX "demographic_evolution_population_millesime_idx" ON "demographic_evolution_population"("millesime");

INSERT INTO data_pack_versions (millesime, label, is_active, created_at) VALUES ('2021', 'Millésime 2021', true, now());

-- CreateIndex
CREATE INDEX "household_sizes_millesime_idx" ON "household_sizes"("millesime");

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demographic_evolution_omphale" ADD CONSTRAINT "demographic_evolution_omphale_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demographic_evolution_population" ADD CONSTRAINT "demographic_evolution_population_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_inadequation_filo" ADD CONSTRAINT "physical_inadequation_filo_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosted_filocom" ADD CONSTRAINT "hosted_filocom_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bad_quality_filocom" ADD CONSTRAINT "bad_quality_filocom_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filocom_flux" ADD CONSTRAINT "filocom_flux_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_sizes" ADD CONSTRAINT "household_sizes_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
