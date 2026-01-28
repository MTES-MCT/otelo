/*
  Warnings:

  - Made the column `authorized_housing_count` on table `sitadel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `started_housing_count` on table `sitadel` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "simulation_results" ADD COLUMN     "exported" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sitadel" ALTER COLUMN "authorized_housing_count" SET NOT NULL,
ALTER COLUMN "started_housing_count" SET NOT NULL;
