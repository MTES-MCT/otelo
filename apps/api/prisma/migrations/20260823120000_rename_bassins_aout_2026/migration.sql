-- Alignement des bassins d'habitat sur le référentiel « BH_NOM_EPCI_AOUT_2026 ».
--
-- `bassin.name` est la clé primaire et `epcis.bassin_name` la seule colonne qui la référence, en
-- `ON UPDATE CASCADE` : renommer la ligne dans `bassin` suffit, la propagation vers `epcis` est
-- faite par la contrainte. Deux écarts sont traités.
--
-- 1. 49 bassins changent de libellé : les codes techniques franciliens (ZO01 … ZO10) et les
--    libellés provisoires (QZE …, ZO …, LITTORAL SUD …, PÉRIURBAIN ÉTENDU) laissent place à des
--    noms de territoire lisibles, affichés tels quels dans l'application (titre de simulation,
--    préfixe « SCoT … », exports).
--
--    Le rapprochement se fait sur deux clés, parce que la base stocke ces bassins sous deux formes :
--      a. le libellé du référentiel, normalisé (espaces insécables ramenés à des espaces, espaces
--         de bord retirés) — le fichier source en contient plusieurs ;
--      b. une forme héritée d'un import plus ancien, où le libellé est préfixé de « Bassin
--         d'habitat de » et amputé de son préfixe technique `QZE `/`ZO ` : « QZE NICE » y est
--         stocké « Bassin d'habitat de NICE », « ZO DU PERCHE » → « Bassin d'habitat de DU
--         PERCHE ». 13 bassins (Provence-Alpes-Côte d'Azur, Brenne, Perche, Pays Chartrain) sont
--         dans ce cas.
--    Les deux formes ne coexistent jamais pour un même bassin ; si cela arrivait, la migration
--    échouerait sur une violation de clé primaire plutôt que d'écraser silencieusement une ligne.
--
-- 2. Deux bassins gardent leur nom mais utilisent un tiret demi-cadratin (« – », U+2013) comme
--    séparateur là où le référentiel — et les 333 autres bassins — utilisent un trait d'union
--    ordinaire (« - », U+002D). L'écart est invisible à l'œil, mais sur une clé primaire il ferait
--    échouer tout rapprochement futur par libellé (réimport du référentiel, jointure sur un
--    export, recherche utilisateur). Deux `UPDATE` ciblés plutôt qu'un `replace()` global sur la
--    table, pour ne pas toucher un bassin dont le tiret demi-cadratin serait délibéré.
--    L'apostrophe typographique de « L’AUDE » (U+2019) est conservée, le référentiel l'utilise
--    aussi.
--
-- L'ensemble est idempotent : le mapping est bijectif et aucun nouveau libellé ne réutilise un
-- ancien, donc une ligne déjà renommée ne se rapproche plus d'aucune entrée et rejouer la
-- migration ne fait rien.

WITH renommage (ancien, nouveau) AS (
  VALUES
    ('AXE LCT', 'AGOUT'),
    ('Arc Quercy', 'ARC QUERCY'),
    ('Bas Ségala - Monts de Lacaune', 'BAS SÉGALA - MONTS DE LACAUNE'),
    ('Bourges Boischaut Cher', 'BOURGES BOISCHAUT CHER'),
    ('CENTRE', 'CENTRE VENDÉE'),
    ('Chateauroux Boischaut Sud', 'CHATEAUROUX BOISCHAUT SUD'),
    ('Chinon Sud Tourraine', 'CHINON SUD TOURRAINE'),
    ('LITTORAL SUD (OCCITANIE)', 'CÔTE VERMEILLE - VALLESPIR'),
    ('LITTORAL SUD (PAYS DE LA LOIRE)', 'OLONNE - GRAND LITTORAL'),
    ('NORD-OUEST LITTORAL', 'NORD-OUEST LITTORAL VENDÉEN'),
    ('Orb - Espinousse', 'ORB - ESPINOUSSE'),
    ('PAYS DE DREUX + FORÊTS DU PERCHE', 'DREUX - PERCHE'),
    ('PAYS DE VALENÇAY BAZELLE ISSOUDUN', 'NORD INDRE'),
    ('PAYS D’ANCENIS ET CHÂTEAUBRIANT-DERVAL', 'ANCENIS - CHÂTEAUBRIANT'),
    ('PETR CENTRE-CHER HORS CA BOURGES PLUS', 'PETR CENTRE CHER'),
    ('PETR FIGEAC QUERCY VALLÉE DE LA DORDOGNE', 'PETR GRAND FIGEAC - QUERCY'),
    ('PLAINE LITTORALE', 'PAYS DE L''OR - LUNEL'),
    ('Paris Métropole', 'PARIS MÉTROPOLE'),
    ('Piedmont Cevennol - Lingas', 'PIEDMONT CEVENNOL - LINGAS'),
    ('PÉRIURBAIN ÉTENDU', 'CENTRE ARIÈGE'),
    ('QZE ARLES', 'ARLES'),
    ('QZE AVIGNON', 'AVIGNON'),
    ('QZE CANNES-ANTIBE', 'CANNES - ANTIBES'),
    ('QZE CAVAILLON-APT', 'CAVAILLON - APT'),
    ('QZE DIGNE LES BAINS', 'DIGNE-LES-BAINS'),
    ('QZE DRAGUIGNAN', 'DRAGUIGNAN'),
    ('QZE MANOSQUE', 'MANOSQUE'),
    ('QZE MARSEILLE AUBAGNE', 'MARSEILLE - AUBAGNE'),
    ('QZE NICE', 'NICE'),
    ('QZE ORANGE', 'ORANGE'),
    ('SCOTS NORD-EST', 'NORD-EST BERRICHON'),
    ('Sologne Romorantinaise', 'SOLOGNE ROMORANTINAISE'),
    ('TERRITOIRE DE LA FORÊT, DES LOGES ET DE LA SOLOGNE', 'FORÊT D’ORLÉANS - SOLOGNE'),
    ('TERRITOIRE DU VAL DE SULLY, DU GIENNOIS ET DU BERRY LOIRE PUISAYE', 'EST LOIRET'),
    ('TERRITOIRES DU GRAND VENDÔMOIS + CC BEAUCE VAL DE LOIRE', 'GRAND VENDÔMOIS'),
    ('VITRY-LE-FRANÇOIS - SAINT-DIZIER', 'SAINT-DIZIER'),
    ('ZO DE LA BRENNE', 'BRENNE'),
    ('ZO DES PAYS CHARTAIN, DE COMBRAY ET COURVILOIS', 'GRAND CHARTRES'),
    ('ZO DU PERCHE', 'PERCHE'),
    ('ZO01', 'CERGY - VEXIN'),
    ('ZO02', 'SAINT-GERMAIN - SEINE AVAL'),
    ('ZO03', 'VERSAILLES - RAMBOUILLET'),
    ('ZO04', 'PARIS-SACLAY - HUREPOIX'),
    ('ZO05', 'ESSONNE EST'),
    ('ZO06', 'FONTAINEBLEAU - MELUN'),
    ('ZO07', 'BRIE - PROVINOIS - YERRES'),
    ('ZO08', 'MARNE-LA-VALLÉE - BRIE'),
    ('ZO09', 'MEAUX - COULOMMIERS'),
    ('ZO10', 'ROISSY - PLAINE DE FRANCE')
)
UPDATE "bassin" b
SET "name" = r.nouveau
FROM renommage r
WHERE btrim(replace(b."name", chr(160), ' ')) IN (
        r.ancien,
        'Bassin d''habitat de ' || regexp_replace(r.ancien, '^(QZE|ZO) ', '')
      )
  AND b."name" <> r.nouveau;

UPDATE "bassin"
SET "name" = 'AMBOISE - BLÉRÉ - CHÂTEAU-RENAULT'
WHERE replace("name", chr(8211), '-') = 'AMBOISE - BLÉRÉ - CHÂTEAU-RENAULT'
  AND "name" <> 'AMBOISE - BLÉRÉ - CHÂTEAU-RENAULT';

UPDATE "bassin"
SET "name" = 'VALLÉE DE L’AUDE - CABARDÈS'
WHERE replace("name", chr(8211), '-') = 'VALLÉE DE L’AUDE - CABARDÈS'
  AND "name" <> 'VALLÉE DE L’AUDE - CABARDÈS';
