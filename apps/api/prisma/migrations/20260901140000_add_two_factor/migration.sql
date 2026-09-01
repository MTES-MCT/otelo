-- Double authentification par code à usage unique envoyé par e-mail.
--
-- Le drapeau vaut « vrai » pour tout le monde, y compris les comptes existants :
-- il ne déclenche la seconde étape que sur la connexion par mot de passe, jamais
-- sur ProConnect. Le poser à vrai partout évite un rattrapage ultérieur si un
-- compte ProConnect se voit un jour attribuer un mot de passe.
ALTER TABLE "users" ADD COLUMN "two_factor_enabled" BOOLEAN NOT NULL DEFAULT true;

-- Table du plugin better-auth : secrets d'application d'authentification et codes de
-- secours. Otelo n'utilise que le code envoyé par e-mail, elle reste donc vide, mais
-- le plugin l'interroge sur certaines routes.
CREATE TABLE "two_factors" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backup_codes" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "failed_verification_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),

    CONSTRAINT "two_factors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "two_factors_secret_idx" ON "two_factors"("secret");

-- CreateIndex
CREATE INDEX "two_factors_user_id_idx" ON "two_factors"("user_id");

-- AddForeignKey
ALTER TABLE "two_factors" ADD CONSTRAINT "two_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
