-- L'e-mail du questionnaire /flash se renseigne après les résultats : il est absent à la création du lead.
ALTER TABLE "amf_leads" ALTER COLUMN "email" DROP NOT NULL;
