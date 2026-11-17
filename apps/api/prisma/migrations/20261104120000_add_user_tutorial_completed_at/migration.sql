-- Nul pour tous les comptes existants : chacun devra suivre le didacticiel en entier une fois.
ALTER TABLE "users" ADD COLUMN "tutorial_completed_at" TIMESTAMP(3);
