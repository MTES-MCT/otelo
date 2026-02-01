-- CreateEnum
CREATE TYPE "NeighborCategory" AS ENUM ('gen', 'logvac', 'mlgmt', 'projdem', 'ressec');

-- CreateTable
CREATE TABLE "epci_neighbors" (
    "epci_code" TEXT NOT NULL,
    "neighbor_epci_code" TEXT NOT NULL,
    "category" "NeighborCategory" NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "epci_neighbors_pkey" PRIMARY KEY ("epci_code","neighbor_epci_code","category")
);

-- CreateIndex
CREATE INDEX "epci_neighbors_epci_code_category_idx" ON "epci_neighbors"("epci_code", "category");

-- AddForeignKey
ALTER TABLE "epci_neighbors" ADD CONSTRAINT "epci_neighbors_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epci_neighbors" ADD CONSTRAINT "epci_neighbors_neighbor_epci_code_fkey" FOREIGN KEY ("neighbor_epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
