-- DropForeignKey
ALTER TABLE "amf_leads" DROP CONSTRAINT "amf_leads_simulation_id_fkey";

-- AlterTable
ALTER TABLE "amf_leads" ALTER COLUMN "simulation_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "amf_leads" ADD CONSTRAINT "amf_leads_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
