-- Une copie chiffrée réversible de la clé vivait à côté de son empreinte, pour permettre
-- de la réafficher en clair. Cela annulait le bénéfice du hachage. Une clé perdue se
-- régénère désormais ; elle ne se relit plus.
ALTER TABLE "api_consumers" DROP COLUMN "encrypted_key";
