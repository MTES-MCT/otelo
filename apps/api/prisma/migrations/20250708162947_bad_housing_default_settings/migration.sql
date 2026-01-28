/*
  Warnings:

  - You are about to drop the column `b12_heberg_gratuit` on the `scenarios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "epci_scenarios" ADD COLUMN     "b2_tx_vacance_courte" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "b2_tx_vacance_longue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "baseEpci" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "scenarios" DROP COLUMN "b12_heberg_gratuit",
ALTER COLUMN "b11_etablissement" SET DEFAULT ARRAY['autreCentre', 'demandeAsile', 'reinsertion', 'centreProvisoire']::"B11Etablissement"[],
ALTER COLUMN "b11_part_etablissement" SET DEFAULT 50,
ALTER COLUMN "b12_cohab_interg_subie" SET DEFAULT 30,
ALTER COLUMN "b13_acc" SET DEFAULT false,
ALTER COLUMN "b13_taux_reallocation" SET DEFAULT 90,
ALTER COLUMN "b14_taux_reallocation" SET DEFAULT 50,
ALTER COLUMN "b15_taux_reallocation" SET DEFAULT 90;
