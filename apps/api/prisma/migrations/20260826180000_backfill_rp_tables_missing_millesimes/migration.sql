-- Les trois tables issues du recensement (`hotel`, `makeshift_housing_rp`,
-- `physical_inadequation_rp`) ont reçu leur colonne `millesime` dans
-- 20260521000000_add_millesime_rp_tables, avec `DEFAULT '2021'` : toutes les lignes déjà présentes
-- sont donc estampillées 2021. Le calcul, lui, les interroge au millésime du scénario
-- (`no-accomodation.service.ts`, `physical-inadequation.service.ts`) avec `findFirstOrThrow`. Sur un
-- environnement dont le data pack actif est 2022, le calcul lève donc P2025 → 500 sur
-- `/simulations/:id/results` → 404 sur la page de résultats côté front.
--
-- Nous n'avons pas les données RP 2022 de ces trois tables : seule la table `rp` a été importée pour
-- ce millésime. En attendant cet import, on recopie les valeurs 2021 sur les millésimes déclarés
-- dans `data_pack_versions` qui n'ont aucune ligne. Les besoins B11 (hors logement) et B15
-- (inadéquation physique) de ces millésimes reposent donc sur le RP 2021, en attendant d'être
-- écrasés par un vrai import CSV.
--
-- Le `NOT EXISTS` ne comble que les trous : un environnement qui a déjà reçu un import pour un
-- millésime n'est pas touché, et un environnement qui ne déclare que 2021 non plus (le produit
-- cartésien avec `data_pack_versions` ne sort alors aucune ligne). Rejouer la migration ne fait
-- rien.

INSERT INTO "hotel" ("epci_code", "millesime", "rp", "sne")
SELECT h."epci_code", v."millesime", h."rp", h."sne"
FROM "hotel" h
CROSS JOIN "data_pack_versions" v
WHERE h."millesime" = '2021'
  AND NOT EXISTS (
    SELECT 1 FROM "hotel" cible
    WHERE cible."epci_code" = h."epci_code" AND cible."millesime" = v."millesime"
  );

INSERT INTO "makeshift_housing_rp" ("epci_code", "millesime", "value")
SELECT m."epci_code", v."millesime", m."value"
FROM "makeshift_housing_rp" m
CROSS JOIN "data_pack_versions" v
WHERE m."millesime" = '2021'
  AND NOT EXISTS (
    SELECT 1 FROM "makeshift_housing_rp" cible
    WHERE cible."epci_code" = m."epci_code" AND cible."millesime" = v."millesime"
  );

INSERT INTO "physical_inadequation_rp" (
  "epci_code", "millesime",
  "nb_men_acc_loc_hlm", "nb_men_acc_loc_meuble", "nb_men_acc_loc_non_hlm", "nb_men_acc_loge_gratuit", "nb_men_acc_ppt",
  "nb_men_mod_loc_hlm", "nb_men_mod_loc_meuble", "nb_men_mod_loc_non_hlm", "nb_men_mod_loge_gratuit", "nb_men_mod_ppt",
  "nb_men_norm_loc_hlm", "nb_men_norm_loc_meuble", "nb_men_norm_loc_non_hlm", "nb_men_norm_loge_gratuit", "nb_men_norm_ppt",
  "nb_men_studio_loc_hlm", "nb_men_studio_loc_meuble", "nb_men_studio_loc_non_hlm", "nb_men_studio_loge_gratuit", "nb_men_studio_ppt"
)
SELECT
  p."epci_code", v."millesime",
  p."nb_men_acc_loc_hlm", p."nb_men_acc_loc_meuble", p."nb_men_acc_loc_non_hlm", p."nb_men_acc_loge_gratuit", p."nb_men_acc_ppt",
  p."nb_men_mod_loc_hlm", p."nb_men_mod_loc_meuble", p."nb_men_mod_loc_non_hlm", p."nb_men_mod_loge_gratuit", p."nb_men_mod_ppt",
  p."nb_men_norm_loc_hlm", p."nb_men_norm_loc_meuble", p."nb_men_norm_loc_non_hlm", p."nb_men_norm_loge_gratuit", p."nb_men_norm_ppt",
  p."nb_men_studio_loc_hlm", p."nb_men_studio_loc_meuble", p."nb_men_studio_loc_non_hlm", p."nb_men_studio_loge_gratuit", p."nb_men_studio_ppt"
FROM "physical_inadequation_rp" p
CROSS JOIN "data_pack_versions" v
WHERE p."millesime" = '2021'
  AND NOT EXISTS (
    SELECT 1 FROM "physical_inadequation_rp" cible
    WHERE cible."epci_code" = p."epci_code" AND cible."millesime" = v."millesime"
  );
