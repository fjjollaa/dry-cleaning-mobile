-- Ekzekuto në Neon SQL Editor PASI llogaria e pronarit ka hyrë një herë në aplikacion.
-- ID-ja e llogarisë shfaqet te faqja /panel pas hyrjes (p.sh. google:1234567890).
-- ZËVENDËSO 'ID_E_PRONARIT' me atë ID të plotë, bashkë me pjesën "google:" ose "github:".
-- Roli 'pronar' = stafi i dyqanit (një dyqan). Çdo llogari e re fillon si 'klient'.

UPDATE perdoruesit SET roli = 'pronar' WHERE konto_id = 'ID_E_PRONARIT';

SELECT konto_id, emri, roli FROM perdoruesit ORDER BY roli, emri;
