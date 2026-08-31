-- CreateEnum
CREATE TYPE "PlanningDocumentType" AS ENUM ('PLH_PLUI', 'SCOT', 'AUTRES');

-- AlterTable
ALTER TABLE "epci_groups" ADD COLUMN     "planning_document_type" "PlanningDocumentType",
ADD COLUMN     "planning_document_name" TEXT;
