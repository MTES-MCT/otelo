-- CreateTable
CREATE TABLE "simulation_collaborators" (
    "id" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "invited_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "simulation_collaborators_simulation_id_user_id_key" ON "simulation_collaborators"("simulation_id", "user_id");

-- AddForeignKey
ALTER TABLE "simulation_collaborators" ADD CONSTRAINT "simulation_collaborators_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_collaborators" ADD CONSTRAINT "simulation_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_collaborators" ADD CONSTRAINT "simulation_collaborators_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
