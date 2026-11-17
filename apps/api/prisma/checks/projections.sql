-- Contrôles de l'import des « Projections détaillées » Omphale.
--
-- Fichier de référence : il n'est joué par aucune migration ni par aucun test, il se passe à la
-- main (psql -f) après un import pour vérifier que le chargement est complet et cohérent.
-- Sauf mention contraire, chaque requête doit renvoyer 0 ligne ou la valeur attendue en commentaire.
--
--   psql "$DATABASE_URL" -f apps/api/prisma/checks/projections.sql
--
-- Les valeurs attendues valent pour le millésime 2022 et les classeurs livrés en août 2026.

\set millesime '2022'

-- ---------------------------------------------------------------------------- 1. Référentiel

-- Deux niveaux, 561 zones.
SELECT level, count(*) FROM projection_zones GROUP BY 1 ORDER BY 1;
-- attendu : BH 347 | EPCI 214

-- Seule `ZZZZZZZZZ`, la zone résiduelle du fichier, n'a pas de bassin.
SELECT code, label FROM projection_zones WHERE level = 'BH' AND bassin_name IS NULL;
-- attendu : ZZZZZZZZZ

-- Les 335 bassins de la base sont couverts.
SELECT count(DISTINCT bassin_name) FROM projection_zones WHERE level = 'BH';
-- attendu : 335

-- 214 zones EPCI + les 12 EPT du Grand Paris.
SELECT count(*) FROM projection_zones WHERE epci_code IS NOT NULL;
-- attendu : 226

-- Aucun rattachement ne pointe dans le vide (la clé étrangère le garantit déjà).
SELECT z.code, z.epci_code
FROM projection_zones z
LEFT JOIN epcis e ON e.code = z.epci_code
WHERE z.epci_code IS NOT NULL AND e.code IS NULL;

-- ---------------------------------------------------------------------------- 2. Volumétrie

SELECT 'projection_population_totals' AS table_cible, count(*) AS lignes, 17361 AS attendu
FROM projection_population_totals WHERE millesime = :'millesime'
UNION ALL SELECT 'projection_population_by_sex', count(*), 34722
FROM projection_population_by_sex WHERE millesime = :'millesime'
UNION ALL SELECT 'projection_population_by_age_sex', count(*), 3472200
FROM projection_population_by_age_sex WHERE millesime = :'millesime'
UNION ALL SELECT 'projection_population_by_age_group', count(*), 104166
FROM projection_population_by_age_group WHERE millesime = :'millesime'
UNION ALL SELECT 'projection_household_totals', count(*), 17361
FROM projection_household_totals WHERE millesime = :'millesime'
UNION ALL SELECT 'projection_household_by_type', count(*), 121527
FROM projection_household_by_type WHERE millesime = :'millesime'
UNION ALL SELECT 'projection_zone_millesimes', count(*), 561
FROM projection_zone_millesimes WHERE millesime = :'millesime';

-- Répartition par niveau, sur la table des totaux.
SELECT z.level, count(*)
FROM projection_population_totals t
JOIN projection_zones z ON z.code = t.zone_code
WHERE t.millesime = :'millesime'
GROUP BY 1 ORDER BY 1;
-- attendu : BH 10331 | EPCI 7030

-- ------------------------------------------------------------------------- 3. Non-régression
--
-- L'import ne touche à aucune table historique. Ces comptages doivent être identiques avant et
-- après.
SELECT 'demographic_evolution_omphale' AS table_historique, count(*) FROM demographic_evolution_omphale
UNION ALL SELECT 'demographic_evolution_population', count(*) FROM demographic_evolution_population
UNION ALL SELECT 'household_sizes', count(*) FROM household_sizes;

-- ---------------------------------------------------------------------------- 4. Robustesse

-- 35 bassins et l'EPCI 200073260 ne sont pas projetés.
SELECT count(*) FROM projection_zone_millesimes WHERE millesime = :'millesime' AND NOT is_robust;
-- attendu : 36

-- Une zone non projetée ne porte que l'année de recensement.
SELECT m.zone_code, count(DISTINCT t.year) AS nb_annees, min(t.year), max(t.year)
FROM projection_zone_millesimes m
JOIN projection_population_totals t ON t.zone_code = m.zone_code AND t.millesime = m.millesime
WHERE m.millesime = :'millesime' AND NOT m.is_robust
GROUP BY 1
HAVING count(DISTINCT t.year) <> 1 OR min(t.year) <> 2018;

-- Symétriquement, une zone projetée porte les 33 années.
SELECT m.zone_code, count(DISTINCT t.year) AS nb_annees
FROM projection_zone_millesimes m
JOIN projection_population_totals t ON t.zone_code = m.zone_code AND t.millesime = m.millesime
WHERE m.millesime = :'millesime' AND m.is_robust
GROUP BY 1
HAVING count(DISTINCT t.year) <> 33;

-- ------------------------------------------------------- 5. Fusion des doublons de recensement
--
-- Les deux bassins de Dordogne portent deux lignes 2018 dans la source, l'une avec la seule
-- population basse, l'autre avec le reste. L'import doit les avoir recomposées en une ligne
-- complète, et laisser les colonnes pb_* vides à partir de 2019.
SELECT zone_code, year,
       pb_b IS NOT NULL AS pop_basse,
       central_c IS NOT NULL AS central,
       ph_h IS NOT NULL AS pop_haute
FROM projection_population_totals
WHERE millesime = :'millesime'
  AND zone_code IN ('R75_24-1_23', 'R75_24-3_23')
  AND year IN (2018, 2019, 2050)
ORDER BY 1, 2;
-- attendu : 2018 → les trois à true ; 2019 et 2050 → pop_basse à false

-- Une seule ligne 2018 par zone, sinon la fusion a échoué.
SELECT zone_code, count(*)
FROM projection_population_totals
WHERE millesime = :'millesime' AND year = 2018 AND zone_code IN ('R75_24-1_23', 'R75_24-3_23')
GROUP BY 1 HAVING count(*) <> 1;

-- --------------------------------------------------------------------------- 6. Grand Paris

-- Les 12 EPT sont rattachés au bassin de la métropole et à leur pseudo-EPCI.
SELECT count(*) FROM projection_zones
WHERE bassin_name = 'PARIS MÉTROPOLE' AND epci_code LIKE '200054781\_T%';
-- attendu : 12

-- La partition tient sur l'année de recensement.
SELECT sum(central_c) AS population_2018
FROM projection_population_totals t
JOIN projection_zones z ON z.code = t.zone_code
WHERE t.millesime = :'millesime' AND t.year = 2018 AND z.bassin_name = 'PARIS MÉTROPOLE';
-- attendu : 7075048, soit exactement la population de la métropole

-- ⚠ Mais deux EPT ne sont pas projetés : additionner les 12 au-delà de 2018 ampute la métropole
-- de 1 155 847 habitants (16 %). Cette requête doit donc renvoyer deux lignes, pas zéro.
SELECT z.code, z.label
FROM projection_zones z
JOIN projection_zone_millesimes m ON m.zone_code = z.code AND m.millesime = :'millesime'
WHERE z.bassin_name = 'PARIS MÉTROPOLE' AND NOT m.is_robust;
-- attendu : R11_BCN_23 et R11_GOSB_23

-- --------------------------------------------------------------- 7. Cohérence inter-feuilles
--
-- Les valeurs sont des flottants : la tolérance est relative, avec un plancher absolu.

-- Somme âge × sexe = population totale.
SELECT t.zone_code, t.year, t.central_c AS total, s.somme, abs(t.central_c - s.somme) AS ecart
FROM projection_population_totals t
JOIN (
  SELECT zone_code, year, sum(central_c) AS somme
  FROM projection_population_by_age_sex WHERE millesime = :'millesime' GROUP BY 1, 2
) s USING (zone_code, year)
WHERE t.millesime = :'millesime'
  AND abs(t.central_c - s.somme) > greatest(1e-6 * t.central_c, 1e-3)
ORDER BY ecart DESC LIMIT 20;

-- Somme par sexe = population totale.
SELECT t.zone_code, t.year, abs(t.central_c - s.somme) AS ecart
FROM projection_population_totals t
JOIN (
  SELECT zone_code, year, sum(central_c) AS somme
  FROM projection_population_by_sex WHERE millesime = :'millesime' GROUP BY 1, 2
) s USING (zone_code, year)
WHERE t.millesime = :'millesime'
  AND abs(t.central_c - s.somme) > greatest(1e-6 * t.central_c, 1e-3)
ORDER BY ecart DESC LIMIT 20;

-- Tranches d'âge : elles se RECOUVRENT, `85+` étant inclus dans `65+`. Le total se reconstitue
-- avec les cinq autres — sommer les six donnerait un excédent de l'ordre de 8 %.
SELECT t.zone_code, t.year, abs(t.central_c - s.somme) AS ecart
FROM projection_population_totals t
JOIN (
  SELECT zone_code, year, sum(central_c) AS somme
  FROM projection_population_by_age_group
  WHERE millesime = :'millesime' AND age_group <> '85+'
  GROUP BY 1, 2
) s USING (zone_code, year)
WHERE t.millesime = :'millesime'
  AND abs(t.central_c - s.somme) > greatest(1e-6 * t.central_c, 1e-3)
ORDER BY ecart DESC LIMIT 20;

-- Et `85+` est bien un sous-ensemble de `65+`.
SELECT a.zone_code, a.year, a.central_c AS plus_85, b.central_c AS plus_65
FROM projection_population_by_age_group a
JOIN projection_population_by_age_group b USING (zone_code, year, millesime)
WHERE a.millesime = :'millesime'
  AND a.age_group = '85+' AND b.age_group = '65+'
  AND a.central_c > b.central_c;

-- Somme des typologies = nombre de ménages.
SELECT t.zone_code, t.year, abs(t.central_c - s.somme) AS ecart
FROM projection_household_totals t
JOIN (
  SELECT zone_code, year, sum(central_c) AS somme
  FROM projection_household_by_type WHERE millesime = :'millesime' GROUP BY 1, 2
) s USING (zone_code, year)
WHERE t.millesime = :'millesime'
  AND abs(t.central_c - s.somme) > greatest(1e-6 * t.central_c, 1e-3)
ORDER BY ecart DESC LIMIT 20;

-- Les modalités ENFANT et HORS_MENAGE sont vides dans toute la source : elles doivent afficher 0
-- valeur non nulle. Si ce n'est plus le cas, la livraison a changé de nature.
SELECT household_type, count(*) FILTER (WHERE coalesce(central_c, 0) <> 0) AS valeurs_non_nulles
FROM projection_household_by_type
WHERE millesime = :'millesime'
GROUP BY 1 ORDER BY 1;
-- attendu : 0 pour ENFANT et HORS_MENAGE, 17361 pour les cinq autres
