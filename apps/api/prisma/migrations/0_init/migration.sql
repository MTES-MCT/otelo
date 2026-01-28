-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SourceB11" AS ENUM ('RP', 'SNE');

-- CreateEnum
CREATE TYPE "SourceB14" AS ENUM ('RP', 'Filo', 'FF');

-- CreateEnum
CREATE TYPE "SourceB15" AS ENUM ('RP', 'Filo');

-- CreateEnum
CREATE TYPE "MotifB17" AS ENUM ('Tout', 'Env', 'Assis', 'Rappr', 'Trois');

-- CreateEnum
CREATE TYPE "B15Surocc" AS ENUM ('Acc', 'Mod');

-- CreateEnum
CREATE TYPE "B11Etablissement" AS ENUM ('autreCentre', 'demandeAsile', 'reinsertion', 'centreProvisoire', 'jeuneTravailleur', 'foyerMigrants', 'malade', 'maisonRelai', 'horsMaisonRelai');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "sub" TEXT,
    "provider" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "hasAccess" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "isConfidential" BOOLEAN NOT NULL DEFAULT true,
    "projection" INTEGER NOT NULL,
    "b1_horizon_resorption" INTEGER NOT NULL DEFAULT 2050,
    "b11_sa" BOOLEAN NOT NULL DEFAULT true,
    "b11_fortune" BOOLEAN NOT NULL DEFAULT true,
    "b11_hotel" BOOLEAN NOT NULL DEFAULT true,
    "source_b11" "SourceB11" NOT NULL DEFAULT 'RP',
    "b11_etablissement" "B11Etablissement"[] DEFAULT ARRAY['autreCentre', 'demandeAsile', 'reinsertion', 'centreProvisoire', 'jeuneTravailleur', 'foyerMigrants', 'malade', 'maisonRelai', 'horsMaisonRelai']::"B11Etablissement"[],
    "b11_part_etablissement" INTEGER NOT NULL DEFAULT 100,
    "b12_cohab_interg_subie" INTEGER NOT NULL DEFAULT 50,
    "b12_heberg_particulier" BOOLEAN NOT NULL DEFAULT true,
    "b12_heberg_gratuit" BOOLEAN NOT NULL DEFAULT true,
    "b12_heberg_temporaire" BOOLEAN NOT NULL DEFAULT true,
    "b13_acc" BOOLEAN NOT NULL DEFAULT true,
    "b13_plp" BOOLEAN NOT NULL DEFAULT true,
    "b13_taux_effort" INTEGER NOT NULL DEFAULT 30,
    "b13_taux_reallocation" INTEGER NOT NULL DEFAULT 80,
    "b14_confort" TEXT NOT NULL DEFAULT 'RP_abs_sani',
    "b14_occupation" TEXT NOT NULL DEFAULT 'prop_loc',
    "b14_qualite" TEXT,
    "source_b14" "SourceB14" NOT NULL DEFAULT 'Filo',
    "b14_taux_reallocation" INTEGER NOT NULL DEFAULT 80,
    "b15_surocc" "B15Surocc" NOT NULL DEFAULT 'Acc',
    "b15_proprietaire" BOOLEAN NOT NULL DEFAULT false,
    "b15_loc_hors_hlm" BOOLEAN NOT NULL DEFAULT true,
    "source_b15" "SourceB15" NOT NULL DEFAULT 'Filo',
    "b15_taux_reallocation" INTEGER NOT NULL DEFAULT 80,
    "b17_motif" "MotifB17" NOT NULL DEFAULT 'Tout',
    "b2_scenario" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bassin" (
    "name" TEXT NOT NULL,

    CONSTRAINT "bassin_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "epci_scenarios" (
    "b2_tx_restructuration" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "b2_tx_disparition" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "b2_tx_vacance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "b2_tx_rs" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "epci_code" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,

    CONSTRAINT "epci_scenarios_pkey" PRIMARY KEY ("epci_code","scenario_id")
);

-- CreateTable
CREATE TABLE "epcis" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "bassin_name" TEXT,

    CONSTRAINT "epcis_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demographic_evolution_omphale" (
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

    CONSTRAINT "demographic_evolution_omphale_pkey" PRIMARY KEY ("epci_code","year")
);

-- CreateTable
CREATE TABLE "demographic_evolution_population" (
    "year" INTEGER NOT NULL,
    "central" DOUBLE PRECISION NOT NULL,
    "haute" DOUBLE PRECISION NOT NULL,
    "basse" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "demographic_evolution_population_pkey" PRIMARY KEY ("epci_code","year")
);

-- CreateTable
CREATE TABLE "physical_inadequation_filo" (
    "surocc_leg" INTEGER NOT NULL,
    "surocc_leg_po" INTEGER NOT NULL,
    "surocc_leg_lp" INTEGER NOT NULL,
    "surocc_leg_lh" INTEGER NOT NULL,
    "surocc_leg_au" INTEGER NOT NULL,
    "surocc_lourde" INTEGER NOT NULL,
    "surocc_lourde_po" INTEGER NOT NULL,
    "surocc_lourde_lp" INTEGER NOT NULL,
    "surocc_lourde_lh" INTEGER NOT NULL,
    "surocc_lourde_au" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "physical_inadequation_filo_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "physical_inadequation_rp" (
    "nb_men_acc_loc_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_acc_loc_meuble" DOUBLE PRECISION NOT NULL,
    "nb_men_acc_loc_non_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_acc_loge_gratuit" DOUBLE PRECISION NOT NULL,
    "nb_men_acc_ppt" DOUBLE PRECISION NOT NULL,
    "nb_men_mod_loc_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_mod_loc_meuble" DOUBLE PRECISION NOT NULL,
    "nb_men_mod_loc_non_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_mod_loge_gratuit" DOUBLE PRECISION NOT NULL,
    "nb_men_mod_ppt" DOUBLE PRECISION NOT NULL,
    "nb_men_norm_loc_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_norm_loc_meuble" DOUBLE PRECISION NOT NULL,
    "nb_men_norm_loc_non_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_norm_loge_gratuit" DOUBLE PRECISION NOT NULL,
    "nb_men_norm_ppt" DOUBLE PRECISION NOT NULL,
    "nb_men_studio_loc_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_studio_loc_meuble" DOUBLE PRECISION NOT NULL,
    "nb_men_studio_loc_non_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_studio_loge_gratuit" DOUBLE PRECISION NOT NULL,
    "nb_men_studio_ppt" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "physical_inadequation_rp_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "financial_inadequation" (
    "nb_all_plus20_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus21_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus22_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus23_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus24_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus25_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus26_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus27_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus28_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus29_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus30_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus31_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus32_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus33_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus34_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus35_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus36_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus37_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus38_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus39_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus40_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus20_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus21_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus22_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus23_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus24_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus25_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus26_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus27_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus28_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus29_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus30_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus31_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus32_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus33_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus34_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus35_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus36_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus37_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus38_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus39_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus40_accession_propriete" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "financial_inadequation_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "hosted_filocom" (
    "value" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "hosted_filocom_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "hosted_finess" (
    "autre_centre" INTEGER NOT NULL,
    "demande_asile" INTEGER NOT NULL,
    "reinsertion" INTEGER NOT NULL,
    "centre_provisoire" INTEGER NOT NULL,
    "jeune_travailleur" INTEGER NOT NULL,
    "foyer_migrants" INTEGER NOT NULL,
    "malade" INTEGER NOT NULL,
    "maison_relai" INTEGER NOT NULL,
    "hors_maison_relai" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "hosted_finess_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "hosted_sne" (
    "particular" INTEGER NOT NULL,
    "free" INTEGER NOT NULL,
    "temporary" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "hosted_sne_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "social_parc" (
    "crea" INTEGER NOT NULL,
    "voisin" INTEGER NOT NULL,
    "mater" INTEGER NOT NULL,
    "services" INTEGER NOT NULL,
    "motifs" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "social_parc_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "hotel" (
    "rp" INTEGER NOT NULL,
    "sne" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "hotel_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "makeshift_housing_rp" (
    "value" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "makeshift_housing_rp_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "makeshift_housing_sne" (
    "camping" INTEGER NOT NULL,
    "squat" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "makeshift_housing_sne_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "homeless" (
    "rp" DOUBLE PRECISION NOT NULL,
    "sne" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "homeless_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "bad_quality_filocom" (
    "pppi_lp" INTEGER NOT NULL,
    "pppi_po" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "bad_quality_filocom_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "bad_quality_rp" (
    "sani_loc_nonhlm" INTEGER NOT NULL,
    "sani_ppt" INTEGER NOT NULL,
    "sani_chfl_loc_nonhlm" INTEGER NOT NULL,
    "sani_chfl_ppt" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "bad_quality_rp_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "bad_quality_fonciers" (
    "pp_ss_wc_loc" INTEGER NOT NULL,
    "pp_ss_wc_ppt" INTEGER NOT NULL,
    "pp_ss_wc_au" INTEGER NOT NULL,
    "pp_ss_chauff_loc" INTEGER NOT NULL,
    "pp_ss_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_chauff_au" INTEGER NOT NULL,
    "pp_ss_sdb_loc" INTEGER NOT NULL,
    "pp_ss_sdb_ppt" INTEGER NOT NULL,
    "pp_ss_sdb_au" INTEGER NOT NULL,
    "pp_ss_wc_chauff_loc" INTEGER NOT NULL,
    "pp_ss_wc_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_wc_chauff_au" INTEGER NOT NULL,
    "pp_ss_wc_sdb_loc" INTEGER NOT NULL,
    "pp_ss_wc_sdb_ppt" INTEGER NOT NULL,
    "pp_ss_wc_sdb_au" INTEGER NOT NULL,
    "pp_ss_sdb_chauff_loc" INTEGER NOT NULL,
    "pp_ss_sdb_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_sdb_chauff_au" INTEGER NOT NULL,
    "pp_ss_3elts_loc" INTEGER NOT NULL,
    "pp_ss_3elts_ppt" INTEGER NOT NULL,
    "pp_ss_3elts_au" INTEGER NOT NULL,
    "pp_ss_ent_wc_loc" INTEGER NOT NULL,
    "pp_ss_ent_wc_ppt" INTEGER NOT NULL,
    "pp_ss_ent_wc_au" INTEGER NOT NULL,
    "pp_ss_ent_chauff_loc" INTEGER NOT NULL,
    "pp_ss_ent_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_ent_chauff_au" INTEGER NOT NULL,
    "pp_ss_ent_sdb_loc" INTEGER NOT NULL,
    "pp_ss_ent_sdb_ppt" INTEGER NOT NULL,
    "pp_ss_ent_sdb_au" INTEGER NOT NULL,
    "pp_ss_ent_wc_chauff_loc" INTEGER NOT NULL,
    "pp_ss_ent_wc_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_ent_wc_chauff_au" INTEGER NOT NULL,
    "pp_ss_ent_wc_sdb_loc" INTEGER NOT NULL,
    "pp_ss_ent_wc_sdb_ppt" INTEGER NOT NULL,
    "pp_ss_ent_wc_sdb_au" INTEGER NOT NULL,
    "pp_ss_ent_sdb_chauff_loc" INTEGER NOT NULL,
    "pp_ss_ent_sdb_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_ent_sdb_chauff_au" INTEGER NOT NULL,
    "pp_ss_ent_3elts_loc" INTEGER NOT NULL,
    "pp_ss_ent_3elts_ppt" INTEGER NOT NULL,
    "pp_ss_ent_3elts_au" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_loc" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_ppt" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_au" INTEGER NOT NULL,
    "pp_ss_quali_ent_chauff_loc" INTEGER NOT NULL,
    "pp_ss_quali_ent_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_quali_ent_chauff_au" INTEGER NOT NULL,
    "pp_ss_quali_ent_sdb_loc" INTEGER NOT NULL,
    "pp_ss_quali_ent_sdb_ppt" INTEGER NOT NULL,
    "pp_ss_quali_ent_sdb_au" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_chauff_loc" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_chauff_au" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_sdb_loc" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_sdb_ppt" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_sdb_au" INTEGER NOT NULL,
    "pp_ss_quali_ent_sdb_chauff_loc" INTEGER NOT NULL,
    "pp_ss_quali_ent_sdb_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_quali_ent_sdb_chauff_au" INTEGER NOT NULL,
    "pp_ss_quali_ent_3elts_loc" INTEGER NOT NULL,
    "pp_ss_quali_ent_3elts_ppt" INTEGER NOT NULL,
    "pp_ss_quali_ent_3elts_au" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "bad_quality_fonciers_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "filocom_flux" (
    "parctot" DOUBLE PRECISION NOT NULL,
    "tx_rp_parctot" DOUBLE PRECISION NOT NULL,
    "tx_rs_parctot" DOUBLE PRECISION NOT NULL,
    "tx_lv_parctot" DOUBLE PRECISION NOT NULL,
    "tx_rest_parctot" DOUBLE PRECISION NOT NULL,
    "tx_disp_parctot" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "filocom_flux_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "vacancy_accommodation" (
    "year" INTEGER NOT NULL,
    "nb_total" INTEGER NOT NULL,
    "nb_log_vac_2less" INTEGER NOT NULL,
    "nb_log_vac_2more" INTEGER NOT NULL,
    "nb_log_vac_5more" INTEGER NOT NULL,
    "prop_log_vac_2less" DOUBLE PRECISION NOT NULL,
    "prop_log_vac_2more" DOUBLE PRECISION NOT NULL,
    "prop_log_vac_5more" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "vacancy_accommodation_pkey" PRIMARY KEY ("epci_code","year")
);

-- CreateTable
CREATE TABLE "sitadel" (
    "year" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "sitadel_pkey" PRIMARY KEY ("epci_code","year")
);

-- CreateTable
CREATE TABLE "rp" (
    "year" INTEGER NOT NULL,
    "menage" DOUBLE PRECISION NOT NULL,
    "population" DOUBLE PRECISION NOT NULL,
    "vacant" DOUBLE PRECISION NOT NULL,
    "principal_accommodation" DOUBLE PRECISION NOT NULL,
    "secondary_accommodation" DOUBLE PRECISION NOT NULL,
    "total_accommodation" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "rp_pkey" PRIMARY KEY ("epci_code","year")
);

-- CreateTable
CREATE TABLE "epci_contiguity" (
    "epci_code" TEXT NOT NULL,
    "contiguous_epci_code" TEXT NOT NULL,

    CONSTRAINT "epci_contiguity_pkey" PRIMARY KEY ("epci_code","contiguous_epci_code")
);

-- CreateTable
CREATE TABLE "_EpciToSimulation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EpciToSimulation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bassin_name_key" ON "bassin"("name");

-- CreateIndex
CREATE INDEX "_EpciToSimulation_B_index" ON "_EpciToSimulation"("B");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epci_scenarios" ADD CONSTRAINT "epci_scenarios_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epci_scenarios" ADD CONSTRAINT "epci_scenarios_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epcis" ADD CONSTRAINT "epcis_bassin_name_fkey" FOREIGN KEY ("bassin_name") REFERENCES "bassin"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demographic_evolution_omphale" ADD CONSTRAINT "demographic_evolution_omphale_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demographic_evolution_population" ADD CONSTRAINT "demographic_evolution_population_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_inadequation_filo" ADD CONSTRAINT "physical_inadequation_filo_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_inadequation_rp" ADD CONSTRAINT "physical_inadequation_rp_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_inadequation" ADD CONSTRAINT "financial_inadequation_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosted_filocom" ADD CONSTRAINT "hosted_filocom_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosted_finess" ADD CONSTRAINT "hosted_finess_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosted_sne" ADD CONSTRAINT "hosted_sne_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_parc" ADD CONSTRAINT "social_parc_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel" ADD CONSTRAINT "hotel_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "makeshift_housing_rp" ADD CONSTRAINT "makeshift_housing_rp_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "makeshift_housing_sne" ADD CONSTRAINT "makeshift_housing_sne_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeless" ADD CONSTRAINT "homeless_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bad_quality_filocom" ADD CONSTRAINT "bad_quality_filocom_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bad_quality_rp" ADD CONSTRAINT "bad_quality_rp_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bad_quality_fonciers" ADD CONSTRAINT "bad_quality_fonciers_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filocom_flux" ADD CONSTRAINT "filocom_flux_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_accommodation" ADD CONSTRAINT "vacancy_accommodation_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sitadel" ADD CONSTRAINT "sitadel_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rp" ADD CONSTRAINT "rp_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epci_contiguity" ADD CONSTRAINT "epci_contiguity_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epci_contiguity" ADD CONSTRAINT "epci_contiguity_contiguous_epci_code_fkey" FOREIGN KEY ("contiguous_epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EpciToSimulation" ADD CONSTRAINT "_EpciToSimulation_A_fkey" FOREIGN KEY ("A") REFERENCES "epcis"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EpciToSimulation" ADD CONSTRAINT "_EpciToSimulation_B_fkey" FOREIGN KEY ("B") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

