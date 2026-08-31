-- CreateTable
CREATE TABLE "simulation_changes" (
    "id" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_name" TEXT,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "simulation_changes_simulation_id_created_at_idx" ON "simulation_changes"("simulation_id", "created_at");

-- CreateIndex
CREATE INDEX "simulation_changes_created_at_idx" ON "simulation_changes"("created_at");

-- AddForeignKey
ALTER TABLE "simulation_changes" ADD CONSTRAINT "simulation_changes_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_changes" ADD CONSTRAINT "simulation_changes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
