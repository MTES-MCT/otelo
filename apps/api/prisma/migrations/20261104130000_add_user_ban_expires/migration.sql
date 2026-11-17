-- Champ attendu par le plugin admin de better-auth, qui vérifie le schéma au démarrage depuis 1.7.16.
ALTER TABLE "users" ADD COLUMN "ban_expires" TIMESTAMP(3);
