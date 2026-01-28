-- CreateTable
CREATE TABLE "household_sizes" (
    "year" INTEGER NOT NULL,
    "central_b" DOUBLE PRECISION NOT NULL,
    "central_c" DOUBLE PRECISION NOT NULL,
    "central_h" DOUBLE PRECISION NOT NULL,
    "ph_b" DOUBLE PRECISION NOT NULL,
    "ph_c" DOUBLE PRECISION NOT NULL,
    "ph_h" DOUBLE PRECISION NOT NULL,
    "pb_b" DOUBLE PRECISION NOT NULL,
    "pb_c" DOUBLE PRECISION NOT NULL,
    "pb_h" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "household_sizes_pkey" PRIMARY KEY ("epci_code","year")
);

-- AddForeignKey
ALTER TABLE "household_sizes" ADD CONSTRAINT "household_sizes_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
