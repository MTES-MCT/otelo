-- Tables de mesures des « Projections détaillées » Omphale — une par feuille des deux classeurs.
--
-- Toutes portent la même clé (zone, année, millésime, plus la dimension propre à la feuille) et
-- les mêmes 9 colonnes de scénario, qui reprennent le nommage déjà en place sur
-- `demographic_evolution_omphale` et `household_sizes` : `central_b/c/h`, `ph_b/c/h` (population
-- haute), `pb_b/c/h` (population basse), où le suffixe désigne l'hypothèse de cohabitation.
--
-- Forme longue sur les dimensions catégorielles, large sur les scénarios : `Population_sexe` et
-- `Population_age_sexe` livrent 18 colonnes (9 scénarios × 2 sexes) et `Menages_typologie` 63
-- (9 × 7 typologies). Les déplier en lignes garde les six tables isomorphes entre elles et avec
-- l'existant, et fait d'un ajout de modalité une valeur d'enum plutôt qu'un ALTER TABLE.
--
-- Les 9 colonnes sont nullables. Deux bassins de Dordogne (`R75_24-1_23`, `R75_24-3_23`) n'ont
-- pas de projection « population basse » au-delà de 2018 : leurs colonnes `pb_*` sont vides sur
-- 2019-2050. C'est le même phénomène que celui traité par
-- 20260707120000_demographic_evolution_scenarios_nullable sur les tables historiques.
--
-- Volumétrie attendue par millésime : 17 361 lignes pour chacun des deux totaux, 34 722 par sexe,
-- 104 166 par tranche d'âge, 121 527 par typologie, et 3 472 200 pour le détail âge × sexe — soit
-- environ 3,77 M de lignes, dont l'essentiel sur cette dernière table.

-- CreateTable
CREATE TABLE "projection_population_totals" (
    "zone_code" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "millesime" TEXT NOT NULL,
    "central_b" DOUBLE PRECISION,
    "central_c" DOUBLE PRECISION,
    "central_h" DOUBLE PRECISION,
    "ph_b" DOUBLE PRECISION,
    "ph_c" DOUBLE PRECISION,
    "ph_h" DOUBLE PRECISION,
    "pb_b" DOUBLE PRECISION,
    "pb_c" DOUBLE PRECISION,
    "pb_h" DOUBLE PRECISION,

    CONSTRAINT "projection_population_totals_pkey" PRIMARY KEY ("zone_code","year","millesime")
);

-- CreateTable
CREATE TABLE "projection_population_by_sex" (
    "zone_code" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sex" "ProjectionSex" NOT NULL,
    "millesime" TEXT NOT NULL,
    "central_b" DOUBLE PRECISION,
    "central_c" DOUBLE PRECISION,
    "central_h" DOUBLE PRECISION,
    "ph_b" DOUBLE PRECISION,
    "ph_c" DOUBLE PRECISION,
    "ph_h" DOUBLE PRECISION,
    "pb_b" DOUBLE PRECISION,
    "pb_c" DOUBLE PRECISION,
    "pb_h" DOUBLE PRECISION,

    CONSTRAINT "projection_population_by_sex_pkey" PRIMARY KEY ("zone_code","year","sex","millesime")
);

-- CreateTable
CREATE TABLE "projection_population_by_age_sex" (
    "zone_code" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" "ProjectionSex" NOT NULL,
    "millesime" TEXT NOT NULL,
    "central_b" DOUBLE PRECISION,
    "central_c" DOUBLE PRECISION,
    "central_h" DOUBLE PRECISION,
    "ph_b" DOUBLE PRECISION,
    "ph_c" DOUBLE PRECISION,
    "ph_h" DOUBLE PRECISION,
    "pb_b" DOUBLE PRECISION,
    "pb_c" DOUBLE PRECISION,
    "pb_h" DOUBLE PRECISION,

    CONSTRAINT "projection_population_by_age_sex_pkey" PRIMARY KEY ("zone_code","year","age","sex","millesime")
);

-- CreateTable
CREATE TABLE "projection_population_by_age_group" (
    "zone_code" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "age_group" "ProjectionAgeGroup" NOT NULL,
    "millesime" TEXT NOT NULL,
    "central_b" DOUBLE PRECISION,
    "central_c" DOUBLE PRECISION,
    "central_h" DOUBLE PRECISION,
    "ph_b" DOUBLE PRECISION,
    "ph_c" DOUBLE PRECISION,
    "ph_h" DOUBLE PRECISION,
    "pb_b" DOUBLE PRECISION,
    "pb_c" DOUBLE PRECISION,
    "pb_h" DOUBLE PRECISION,

    CONSTRAINT "projection_population_by_age_group_pkey" PRIMARY KEY ("zone_code","year","age_group","millesime")
);

-- CreateTable
CREATE TABLE "projection_household_totals" (
    "zone_code" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "millesime" TEXT NOT NULL,
    "central_b" DOUBLE PRECISION,
    "central_c" DOUBLE PRECISION,
    "central_h" DOUBLE PRECISION,
    "ph_b" DOUBLE PRECISION,
    "ph_c" DOUBLE PRECISION,
    "ph_h" DOUBLE PRECISION,
    "pb_b" DOUBLE PRECISION,
    "pb_c" DOUBLE PRECISION,
    "pb_h" DOUBLE PRECISION,

    CONSTRAINT "projection_household_totals_pkey" PRIMARY KEY ("zone_code","year","millesime")
);

-- CreateTable
CREATE TABLE "projection_household_by_type" (
    "zone_code" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "household_type" "ProjectionHouseholdType" NOT NULL,
    "millesime" TEXT NOT NULL,
    "central_b" DOUBLE PRECISION,
    "central_c" DOUBLE PRECISION,
    "central_h" DOUBLE PRECISION,
    "ph_b" DOUBLE PRECISION,
    "ph_c" DOUBLE PRECISION,
    "ph_h" DOUBLE PRECISION,
    "pb_b" DOUBLE PRECISION,
    "pb_c" DOUBLE PRECISION,
    "pb_h" DOUBLE PRECISION,

    CONSTRAINT "projection_household_by_type_pkey" PRIMARY KEY ("zone_code","year","household_type","millesime")
);

-- CreateIndex
CREATE INDEX "projection_population_totals_millesime_idx" ON "projection_population_totals"("millesime");

-- CreateIndex
CREATE INDEX "projection_population_by_sex_millesime_idx" ON "projection_population_by_sex"("millesime");

-- CreateIndex
CREATE INDEX "projection_population_by_age_sex_millesime_idx" ON "projection_population_by_age_sex"("millesime");

-- CreateIndex
CREATE INDEX "projection_population_by_age_group_millesime_idx" ON "projection_population_by_age_group"("millesime");

-- CreateIndex
CREATE INDEX "projection_household_totals_millesime_idx" ON "projection_household_totals"("millesime");

-- CreateIndex
CREATE INDEX "projection_household_by_type_millesime_idx" ON "projection_household_by_type"("millesime");

-- AddForeignKey
ALTER TABLE "projection_population_totals" ADD CONSTRAINT "projection_population_totals_zone_code_fkey" FOREIGN KEY ("zone_code") REFERENCES "projection_zones"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_population_totals" ADD CONSTRAINT "projection_population_totals_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_population_by_sex" ADD CONSTRAINT "projection_population_by_sex_zone_code_fkey" FOREIGN KEY ("zone_code") REFERENCES "projection_zones"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_population_by_sex" ADD CONSTRAINT "projection_population_by_sex_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_population_by_age_sex" ADD CONSTRAINT "projection_population_by_age_sex_zone_code_fkey" FOREIGN KEY ("zone_code") REFERENCES "projection_zones"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_population_by_age_sex" ADD CONSTRAINT "projection_population_by_age_sex_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_population_by_age_group" ADD CONSTRAINT "projection_population_by_age_group_zone_code_fkey" FOREIGN KEY ("zone_code") REFERENCES "projection_zones"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_population_by_age_group" ADD CONSTRAINT "projection_population_by_age_group_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_household_totals" ADD CONSTRAINT "projection_household_totals_zone_code_fkey" FOREIGN KEY ("zone_code") REFERENCES "projection_zones"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_household_totals" ADD CONSTRAINT "projection_household_totals_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_household_by_type" ADD CONSTRAINT "projection_household_by_type_zone_code_fkey" FOREIGN KEY ("zone_code") REFERENCES "projection_zones"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_household_by_type" ADD CONSTRAINT "projection_household_by_type_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
