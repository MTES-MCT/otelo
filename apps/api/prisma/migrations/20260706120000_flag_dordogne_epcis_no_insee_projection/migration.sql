-- Ces EPCI de Dordogne (Périgord) n'ont pas de projection démographique INSEE
-- robuste : seules les données rétrospectives sont disponibles. Ils avaient été
-- oubliés dans le flag initial (20260325134047_add_no_insee_projection_flag),
-- ce qui provoquait une erreur à l'étape « Paramétrages démographiques ».
UPDATE "epcis" SET "no_insee_projection" = true WHERE "code" IN (
  '200034197', '200034833', '200040400', '200040889', '200041572',
  '200071819', '242400752', '242400935', '242401024'
);
