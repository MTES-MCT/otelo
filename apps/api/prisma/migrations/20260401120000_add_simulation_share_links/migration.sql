-- CreateTable
CREATE TABLE "simulation_share_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "simulation_share_links_token_key" ON "simulation_share_links"("token");

-- CreateIndex
CREATE UNIQUE INDEX "simulation_share_links_simulation_id_key" ON "simulation_share_links"("simulation_id");

-- AddForeignKey
ALTER TABLE "simulation_share_links" ADD CONSTRAINT "simulation_share_links_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
