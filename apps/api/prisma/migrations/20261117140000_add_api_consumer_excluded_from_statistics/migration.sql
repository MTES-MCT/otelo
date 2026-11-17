-- Clé d'API écartée des statistiques d'usage, comme un compte marqué ou un compte de l'équipe.
ALTER TABLE "api_consumers" ADD COLUMN "excluded_from_statistics" BOOLEAN NOT NULL DEFAULT false;
