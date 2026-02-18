CREATE TABLE "data_pack_versions" (
    "millesime" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_pack_versions_pkey" PRIMARY KEY ("millesime")
);

INSERT INTO "data_pack_versions" ("millesime", "label", "is_active", "created_at")
VALUES ('2021', 'Millésime 2021', true, NOW());

ALTER TABLE "scenarios" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';

ALTER TABLE "bad_quality_filocom" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "bad_quality_filocom" DROP CONSTRAINT "bad_quality_filocom_pkey";
ALTER TABLE "bad_quality_filocom" ADD CONSTRAINT "bad_quality_filocom_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "bad_quality_rp" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "bad_quality_rp" DROP CONSTRAINT "bad_quality_rp_pkey";
ALTER TABLE "bad_quality_rp" ADD CONSTRAINT "bad_quality_rp_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "bad_quality_fonciers" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "bad_quality_fonciers" DROP CONSTRAINT "bad_quality_fonciers_pkey";
ALTER TABLE "bad_quality_fonciers" ADD CONSTRAINT "bad_quality_fonciers_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "physical_inadequation_rp" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "physical_inadequation_rp" DROP CONSTRAINT "physical_inadequation_rp_pkey";
ALTER TABLE "physical_inadequation_rp" ADD CONSTRAINT "physical_inadequation_rp_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "physical_inadequation_filo" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "physical_inadequation_filo" DROP CONSTRAINT "physical_inadequation_filo_pkey";
ALTER TABLE "physical_inadequation_filo" ADD CONSTRAINT "physical_inadequation_filo_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "financial_inadequation" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "financial_inadequation" DROP CONSTRAINT "financial_inadequation_pkey";
ALTER TABLE "financial_inadequation" ADD CONSTRAINT "financial_inadequation_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "filocom_flux" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "filocom_flux" DROP CONSTRAINT "filocom_flux_pkey";
ALTER TABLE "filocom_flux" ADD CONSTRAINT "filocom_flux_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "hosted_filocom" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "hosted_filocom" DROP CONSTRAINT "hosted_filocom_pkey";
ALTER TABLE "hosted_filocom" ADD CONSTRAINT "hosted_filocom_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "hosted_finess" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "hosted_finess" DROP CONSTRAINT "hosted_finess_pkey";
ALTER TABLE "hosted_finess" ADD CONSTRAINT "hosted_finess_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "hosted_sne" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "hosted_sne" DROP CONSTRAINT "hosted_sne_pkey";
ALTER TABLE "hosted_sne" ADD CONSTRAINT "hosted_sne_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "hotel" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "hotel" DROP CONSTRAINT "hotel_pkey";
ALTER TABLE "hotel" ADD CONSTRAINT "hotel_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "makeshift_housing_rp" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "makeshift_housing_rp" DROP CONSTRAINT "makeshift_housing_rp_pkey";
ALTER TABLE "makeshift_housing_rp" ADD CONSTRAINT "makeshift_housing_rp_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "makeshift_housing_sne" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "makeshift_housing_sne" DROP CONSTRAINT "makeshift_housing_sne_pkey";
ALTER TABLE "makeshift_housing_sne" ADD CONSTRAINT "makeshift_housing_sne_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "homeless" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "homeless" DROP CONSTRAINT "homeless_pkey";
ALTER TABLE "homeless" ADD CONSTRAINT "homeless_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "social_parc" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "social_parc" DROP CONSTRAINT "social_parc_pkey";
ALTER TABLE "social_parc" ADD CONSTRAINT "social_parc_pkey" PRIMARY KEY ("epci_code", "millesime");

ALTER TABLE "rp" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "rp" DROP CONSTRAINT "rp_pkey";
ALTER TABLE "rp" ADD CONSTRAINT "rp_pkey" PRIMARY KEY ("epci_code", "year", "millesime");

ALTER TABLE "sitadel" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "sitadel" DROP CONSTRAINT "sitadel_pkey";
ALTER TABLE "sitadel" ADD CONSTRAINT "sitadel_pkey" PRIMARY KEY ("epci_code", "year", "millesime");

ALTER TABLE "demographic_evolution_omphale" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "demographic_evolution_omphale" DROP CONSTRAINT "demographic_evolution_omphale_pkey";
ALTER TABLE "demographic_evolution_omphale" ADD CONSTRAINT "demographic_evolution_omphale_pkey" PRIMARY KEY ("epci_code", "year", "millesime");

ALTER TABLE "demographic_evolution_population" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "demographic_evolution_population" DROP CONSTRAINT "demographic_evolution_population_pkey";
ALTER TABLE "demographic_evolution_population" ADD CONSTRAINT "demographic_evolution_population_pkey" PRIMARY KEY ("epci_code", "year", "millesime");

ALTER TABLE "household_sizes" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "household_sizes" DROP CONSTRAINT "household_sizes_pkey";
ALTER TABLE "household_sizes" ADD CONSTRAINT "household_sizes_pkey" PRIMARY KEY ("epci_code", "year", "millesime");

ALTER TABLE "vacancy_accommodation" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';
ALTER TABLE "vacancy_accommodation" DROP CONSTRAINT "vacancy_accommodation_pkey";
ALTER TABLE "vacancy_accommodation" ADD CONSTRAINT "vacancy_accommodation_pkey" PRIMARY KEY ("epci_code", "year", "millesime");

ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bad_quality_filocom" ADD CONSTRAINT "bad_quality_filocom_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bad_quality_rp" ADD CONSTRAINT "bad_quality_rp_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bad_quality_fonciers" ADD CONSTRAINT "bad_quality_fonciers_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "physical_inadequation_rp" ADD CONSTRAINT "physical_inadequation_rp_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "physical_inadequation_filo" ADD CONSTRAINT "physical_inadequation_filo_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_inadequation" ADD CONSTRAINT "financial_inadequation_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "filocom_flux" ADD CONSTRAINT "filocom_flux_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hosted_filocom" ADD CONSTRAINT "hosted_filocom_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hosted_finess" ADD CONSTRAINT "hosted_finess_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hosted_sne" ADD CONSTRAINT "hosted_sne_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hotel" ADD CONSTRAINT "hotel_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "makeshift_housing_rp" ADD CONSTRAINT "makeshift_housing_rp_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "makeshift_housing_sne" ADD CONSTRAINT "makeshift_housing_sne_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "homeless" ADD CONSTRAINT "homeless_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "social_parc" ADD CONSTRAINT "social_parc_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rp" ADD CONSTRAINT "rp_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sitadel" ADD CONSTRAINT "sitadel_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "demographic_evolution_omphale" ADD CONSTRAINT "demographic_evolution_omphale_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "demographic_evolution_population" ADD CONSTRAINT "demographic_evolution_population_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "household_sizes" ADD CONSTRAINT "household_sizes_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vacancy_accommodation" ADD CONSTRAINT "vacancy_accommodation_millesime_fkey" FOREIGN KEY ("millesime") REFERENCES "data_pack_versions"("millesime") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "demographic_evolution_omphale_millesime_idx" ON "demographic_evolution_omphale"("millesime");
CREATE INDEX "demographic_evolution_population_millesime_idx" ON "demographic_evolution_population"("millesime");
CREATE INDEX "rp_millesime_idx" ON "rp"("millesime");
CREATE INDEX "sitadel_millesime_idx" ON "sitadel"("millesime");
CREATE INDEX "household_sizes_millesime_idx" ON "household_sizes"("millesime");
CREATE INDEX "vacancy_accommodation_millesime_idx" ON "vacancy_accommodation"("millesime");
