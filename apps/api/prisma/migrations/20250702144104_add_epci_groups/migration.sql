-- CreateTable
CREATE TABLE "epci_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "epci_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epci_group_epcis" (
    "epci_group_id" TEXT NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "epci_group_epcis_pkey" PRIMARY KEY ("epci_group_id","epci_code")
);

-- AddForeignKey
ALTER TABLE "epci_groups" ADD CONSTRAINT "epci_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epci_group_epcis" ADD CONSTRAINT "epci_group_epcis_epci_group_id_fkey" FOREIGN KEY ("epci_group_id") REFERENCES "epci_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epci_group_epcis" ADD CONSTRAINT "epci_group_epcis_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
