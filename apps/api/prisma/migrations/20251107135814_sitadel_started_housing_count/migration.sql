/*
  Warnings:

  - You are about to drop the column `value` on the `sitadel` table. All the data in the column will be lost.
  - Added the required column `authorized_housing_count` to the `sitadel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `started_housing_count` to the `sitadel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sitadel" DROP COLUMN "value",
ADD COLUMN     "authorized_housing_count" INTEGER,
ADD COLUMN     "started_housing_count" INTEGER;
