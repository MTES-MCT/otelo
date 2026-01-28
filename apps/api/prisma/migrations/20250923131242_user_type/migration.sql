-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('DDT', 'AgenceUrbanisme', 'Collectivite', 'DREAL', 'BureauEtudes', 'Autre');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "type" "UserType";
