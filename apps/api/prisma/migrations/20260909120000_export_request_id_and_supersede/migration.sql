-- Regroupe les lignes `exports` d'une même demande et permet de marquer une
-- demande comme remplacée par une demande ultérieure sur le même territoire.

-- AlterTable
ALTER TABLE "exports" ADD COLUMN "request_id" TEXT;
-- Les demandes antérieures gardent un tableau vide : le territoire demandé
-- n'était persisté nulle part, et l'inventer à partir des EPCI des simulations
-- ferait passer pour des doublons des demandes qui n'en sont pas.
ALTER TABLE "exports" ADD COLUMN "epci_codes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "exports" ADD COLUMN "superseded_at" TIMESTAMP(3);
ALTER TABLE "exports" ADD COLUMN "superseded_by_request_id" TEXT;

-- Backfill : une demande historique correspond aux lignes écrites par un même
-- `createMany`, qui partagent donc `created_at` pour un même demandeur et un
-- même type d'export. `IS NOT DISTINCT FROM` regroupe aussi les simulations
-- rattachées à un api_consumer (user_id NULL).
UPDATE "exports" e
SET "request_id" = d."request_id"
FROM (
    SELECT s."user_id", e2."created_at", e2."type", gen_random_uuid()::text AS "request_id"
    FROM "exports" e2
    JOIN "simulations" s ON s."id" = e2."simulation_id"
    GROUP BY s."user_id", e2."created_at", e2."type"
  ) d,
  "simulations" s2
WHERE s2."id" = e."simulation_id"
  AND s2."user_id" IS NOT DISTINCT FROM d."user_id"
  AND e."created_at" = d."created_at"
  AND e."type" = d."type";

-- Filet de sécurité : toute ligne que le backfill n'aurait pas atteinte reçoit
-- son propre identifiant, quitte à être seule dans sa demande.
UPDATE "exports" SET "request_id" = gen_random_uuid()::text WHERE "request_id" IS NULL;

ALTER TABLE "exports" ALTER COLUMN "request_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "exports_request_id_idx" ON "exports"("request_id");
CREATE INDEX "exports_superseded_at_idx" ON "exports"("superseded_at");
