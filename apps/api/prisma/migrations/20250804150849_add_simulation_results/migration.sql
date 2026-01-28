-- CreateTable
CREATE TABLE "simulation_results" (
    "id" TEXT NOT NULL,
    "epci_code" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "totalFlux" INTEGER NOT NULL DEFAULT 0,
    "totalStock" INTEGER NOT NULL DEFAULT 0,
    "vacantAccomodation" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "simulation_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "simulation_results_epci_code_simulation_id_key" ON "simulation_results"("epci_code", "simulation_id");

-- AddForeignKey
ALTER TABLE "simulation_results" ADD CONSTRAINT "simulation_results_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_results" ADD CONSTRAINT "simulation_results_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
