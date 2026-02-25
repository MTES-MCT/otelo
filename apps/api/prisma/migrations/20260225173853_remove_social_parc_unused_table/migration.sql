/*
  Warnings:

  - You are about to drop the `social_parc` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "social_parc" DROP CONSTRAINT "social_parc_epci_code_fkey";

-- DropForeignKey
ALTER TABLE "social_parc" DROP CONSTRAINT "social_parc_millesime_fkey";

-- DropTable
DROP TABLE "social_parc";
