-- DropForeignKey
ALTER TABLE "epci_scenarios" DROP CONSTRAINT "epci_scenarios_scenario_id_fkey";

-- DropForeignKey
ALTER TABLE "impersonation_sessions" DROP CONSTRAINT "impersonation_sessions_admin_user_id_fkey";

-- DropForeignKey
ALTER TABLE "impersonation_sessions" DROP CONSTRAINT "impersonation_sessions_target_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_impersonated_user_id_fkey";

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_impersonated_user_id_fkey" FOREIGN KEY ("impersonated_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epci_scenarios" ADD CONSTRAINT "epci_scenarios_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
