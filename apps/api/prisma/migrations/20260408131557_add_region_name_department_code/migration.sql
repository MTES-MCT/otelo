-- AlterTable
ALTER TABLE "epcis" ADD COLUMN     "region_name" TEXT,
ADD COLUMN     "department_code" TEXT,
ADD COLUMN     "department_name" TEXT;

-- Backfill region_name from INSEE region codes
UPDATE "epcis" SET "region_name" = CASE "region"
  WHEN '01' THEN 'Guadeloupe'
  WHEN '02' THEN 'Martinique'
  WHEN '03' THEN 'Guyane'
  WHEN '04' THEN 'La Réunion'
  WHEN '06' THEN 'Mayotte'
  WHEN '11' THEN 'Île-de-France'
  WHEN '24' THEN 'Centre-Val de Loire'
  WHEN '27' THEN 'Bourgogne-Franche-Comté'
  WHEN '28' THEN 'Normandie'
  WHEN '32' THEN 'Hauts-de-France'
  WHEN '44' THEN 'Grand Est'
  WHEN '52' THEN 'Pays de la Loire'
  WHEN '53' THEN 'Bretagne'
  WHEN '75' THEN 'Nouvelle-Aquitaine'
  WHEN '76' THEN 'Occitanie'
  WHEN '84' THEN 'Auvergne-Rhône-Alpes'
  WHEN '93' THEN 'Provence-Alpes-Côte d''Azur'
  WHEN '94' THEN 'Corse'
  ELSE 'Inconnu'
END;
