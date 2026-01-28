-- AlterTable
ALTER TABLE "simulations" ADD COLUMN     "epci_group_id" TEXT;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_epci_group_id_fkey" FOREIGN KEY ("epci_group_id") REFERENCES "epci_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
