/*
  Warnings:

  - You are about to drop the column `free` on the `hosted_sne` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "hosted_sne" DROP COLUMN IF EXISTS "free";
