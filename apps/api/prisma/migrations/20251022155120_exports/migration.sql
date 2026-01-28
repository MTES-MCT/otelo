/*
  Warnings:

  - You are about to drop the column `exported` on the `simulations` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('POWERPOINT', 'EXCEL');


-- CreateTable
CREATE TABLE "exports" (
    "id" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ExportType" NOT NULL,

    CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

-- Insert row from already exported simulations
INSERT INTO "exports" ("id", "simulation_id", "type")
SELECT gen_random_uuid(), "id", 'POWERPOINT'
FROM "simulations"
WHERE "exported" = true;

-- AlterTable
ALTER TABLE "simulations" DROP COLUMN "exported";

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
