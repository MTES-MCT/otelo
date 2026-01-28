-- DropForeignKey
ALTER TABLE "public"."simulation_results" DROP CONSTRAINT "simulation_results_simulation_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."simulation_results" ADD CONSTRAINT "simulation_results_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
