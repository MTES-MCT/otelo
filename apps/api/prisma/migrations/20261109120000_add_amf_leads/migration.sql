-- CreateTable
CREATE TABLE "amf_leads" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "epci_code" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amf_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amf_shared_contacts" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amf_shared_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "amf_leads_simulation_id_key" ON "amf_leads"("simulation_id");

-- CreateIndex
CREATE INDEX "amf_shared_contacts_lead_id_idx" ON "amf_shared_contacts"("lead_id");

-- AddForeignKey
ALTER TABLE "amf_leads" ADD CONSTRAINT "amf_leads_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amf_shared_contacts" ADD CONSTRAINT "amf_shared_contacts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "amf_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
