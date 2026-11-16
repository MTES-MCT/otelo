-- Compte écarté des statistiques d'usage, comme ceux de l'équipe.
ALTER TABLE "users" ADD COLUMN "excluded_from_statistics" BOOLEAN NOT NULL DEFAULT false;
