/*
  Warnings:

  - You are about to drop the column `exported` on the `simulation_results` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "epci_groups" ADD COLUMN     "deleted" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "simulation_results" DROP COLUMN "exported";
