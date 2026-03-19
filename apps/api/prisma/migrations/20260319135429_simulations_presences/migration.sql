-- CreateTable
CREATE TABLE "simulation_presences" (
    "id" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_presences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "simulation_presences_last_seen_idx" ON "simulation_presences"("last_seen");

-- CreateIndex
CREATE UNIQUE INDEX "simulation_presences_simulation_id_user_id_key" ON "simulation_presences"("simulation_id", "user_id");

-- AddForeignKey
ALTER TABLE "simulation_presences" ADD CONSTRAINT "simulation_presences_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_presences" ADD CONSTRAINT "simulation_presences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
