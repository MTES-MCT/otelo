-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN     "demographic_evolution_omphale_custom_id" TEXT;

-- CreateTable
CREATE TABLE "demographic_evolution_omphale_custom" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "user_id" TEXT NOT NULL,
    "epci_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demographic_evolution_omphale_custom_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_demographic_evolution_omphale_custom_id_fkey" FOREIGN KEY ("demographic_evolution_omphale_custom_id") REFERENCES "demographic_evolution_omphale_custom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demographic_evolution_omphale_custom" ADD CONSTRAINT "demographic_evolution_omphale_custom_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demographic_evolution_omphale_custom" ADD CONSTRAINT "demographic_evolution_omphale_custom_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
