-- Les contours d'EPCI étaient lus à chaque rendu de la page de résultats sur geo.api.gouv.fr, dans
-- le chemin bloquant. Deux appels par EPCI et par rendu (onglet du bassin + onglet de l'EPCI),
-- depuis l'IP de sortie mutualisée de la plateforme : l'API Géo a fini par refuser nos connexions
-- (RST immédiat sur les ports 80 et 443), et la page attendait le timeout avant de masquer la carte.
--
-- Le contour d'un EPCI ne bouge qu'au gré des fusions de communes : on le stocke chez nous, rempli
-- une fois par `pnpm -F api cli backfill-epci-contours --write`.
--
-- Table dédiée plutôt qu'une colonne d'`epcis` : les endpoints EPCI renvoient la ligne entière
-- (`findMany` sans `select`), et un contour pèse de 15 à 60 ko. Le sortir d'`epcis` garantit qu'il
-- ne voyage que sur l'endpoint de la carte.

CREATE TABLE "epci_contours" (
    "epci_code" TEXT NOT NULL,
    "contour" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epci_contours_pkey" PRIMARY KEY ("epci_code")
);

ALTER TABLE "epci_contours" ADD CONSTRAINT "epci_contours_epci_code_fkey"
    FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
