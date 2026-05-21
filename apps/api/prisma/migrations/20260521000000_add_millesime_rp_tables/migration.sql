-- physical_inadequation_rp
ALTER TABLE "physical_inadequation_rp" DROP CONSTRAINT "physical_inadequation_rp_pkey",
ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021',
ADD CONSTRAINT "physical_inadequation_rp_pkey" PRIMARY KEY ("epci_code", "millesime");

-- hotel
ALTER TABLE "hotel" DROP CONSTRAINT "hotel_pkey",
ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021',
ADD CONSTRAINT "hotel_pkey" PRIMARY KEY ("epci_code", "millesime");

-- makeshift_housing_rp
ALTER TABLE "makeshift_housing_rp" DROP CONSTRAINT "makeshift_housing_rp_pkey",
ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021',
ADD CONSTRAINT "makeshift_housing_rp_pkey" PRIMARY KEY ("epci_code", "millesime");

-- CreateIndex
CREATE INDEX "physical_inadequation_rp_millesime_idx" ON "physical_inadequation_rp"("millesime");
CREATE INDEX "hotel_millesime_idx" ON "hotel"("millesime");
CREATE INDEX "makeshift_housing_rp_millesime_idx" ON "makeshift_housing_rp"("millesime");

-- AddForeignKey
ALTER TABLE "physical_inadequation_rp" ADD CONSTRAINT "physical_inadequation_rp_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hotel" ADD CONSTRAINT "hotel_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "makeshift_housing_rp" ADD CONSTRAINT "makeshift_housing_rp_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
