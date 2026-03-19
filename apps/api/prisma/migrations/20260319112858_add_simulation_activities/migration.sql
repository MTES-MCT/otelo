-- CreateTable
CREATE TABLE "simulation_activities" (
    "id" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "simulation_activities_simulation_id_created_at_idx" ON "simulation_activities"("simulation_id", "created_at");

-- AddForeignKey
ALTER TABLE "simulation_activities" ADD CONSTRAINT "simulation_activities_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_activities" ADD CONSTRAINT "simulation_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
