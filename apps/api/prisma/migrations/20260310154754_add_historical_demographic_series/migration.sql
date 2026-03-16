-- CreateTable
CREATE TABLE "historical_demographic_series" (
    "epci_code" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "historical_demographic_series_pkey" PRIMARY KEY ("epci_code","year","type")
);

-- CreateIndex
CREATE INDEX "historical_demographic_series_type_idx" ON "historical_demographic_series"("type");

-- AddForeignKey
ALTER TABLE "historical_demographic_series" ADD CONSTRAINT "historical_demographic_series_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
