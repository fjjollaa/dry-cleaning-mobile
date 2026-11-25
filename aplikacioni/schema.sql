-- Pastrim kimik · tabelat. Ekzekuto në Neon SQL Editor (databaza jote, jo e profesorit).
-- Emrat, kategoritë dhe çmimet e shërbimeve më poshtë janë VLERA SHEMBULL (jo të një dyqani real).
-- Zëvendësoji me listën dhe çmimet reale të dyqanit kur t'i marrësh nga pronari.

-- konto_id = 'google:<numri>', 'github:<numri>' ose 'email:<uuid>' (ofruesi + ID e llogarisë).
-- Llogaritë me email + fjalëkalim ruajnë vetëm HASH-in e fjalëkalimit (kurrë fjalëkalimin).
CREATE TABLE IF NOT EXISTS perdoruesit (
  konto_id TEXT PRIMARY KEY,
  emri TEXT NOT NULL,
  roli TEXT NOT NULL DEFAULT 'klient' CHECK (roli IN ('klient', 'pronar'))
);

ALTER TABLE perdoruesit ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE perdoruesit ADD COLUMN IF NOT EXISTS fjalekalimi TEXT;
ALTER TABLE perdoruesit ADD COLUMN IF NOT EXISTS deshtime INTEGER NOT NULL DEFAULT 0;
ALTER TABLE perdoruesit ADD COLUMN IF NOT EXISTS bllokuar_deri TIMESTAMPTZ;
ALTER TABLE perdoruesit ADD COLUMN IF NOT EXISTS krijuar TIMESTAMPTZ NOT NULL DEFAULT now();
-- Koha kur përdoruesi pranoi politikën e privatësisë gjatë regjistrimit me email (NULL për llogaritë më të vjetra ose me Google).
ALTER TABLE perdoruesit ADD COLUMN IF NOT EXISTS privatesia_pranuar TIMESTAMPTZ;

-- Një llogari për email (pa dallim shkronjash të mëdha/të vogla).
CREATE UNIQUE INDEX IF NOT EXISTS perdoruesit_email_unik ON perdoruesit (lower(email)) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS sherbimet (
  id TEXT PRIMARY KEY CHECK (id ~ '^[a-z0-9-]{1,32}$'),
  kategoria TEXT NOT NULL DEFAULT 'Të tjera',
  emri TEXT NOT NULL,
  pershkrimi TEXT NOT NULL DEFAULT '',
  cmimi_euro NUMERIC(8, 2) CHECK (cmimi_euro IS NULL OR cmimi_euro >= 0),
  njesia TEXT NOT NULL DEFAULT 'copë'
);

-- Një porosi = një ditë sjelljeje + disa artikuj (tabela porosia_artikujt).
-- Statusi ecën vetëm përpara: pritje → pranuar → ne_pastrim → gati → marre.
-- 'refuzuar' lejohet vetëm nga 'pritje'.
-- kodi: gjenerohet te formulari një herë; klikimi i dyfishtë dërgon të njëjtin kod, pra nuk bën kopje.
CREATE TABLE IF NOT EXISTS porosite (
  id BIGSERIAL PRIMARY KEY,
  kodi UUID NOT NULL,
  klienti_id TEXT NOT NULL REFERENCES perdoruesit (konto_id),
  data_sjelljes DATE NOT NULL,
  shenime TEXT NOT NULL DEFAULT '' CHECK (char_length(shenime) <= 200),
  statusi TEXT NOT NULL DEFAULT 'pritje'
    CHECK (statusi IN ('pritje', 'pranuar', 'ne_pastrim', 'gati', 'marre', 'refuzuar')),
  krijuar TIMESTAMPTZ NOT NULL DEFAULT now(),
  ndryshuar TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (klienti_id, kodi)
);

CREATE INDEX IF NOT EXISTS porosite_statusi_data_idx ON porosite (statusi, data_sjelljes);

CREATE TABLE IF NOT EXISTS porosia_artikujt (
  porosia_id BIGINT NOT NULL REFERENCES porosite (id) ON DELETE CASCADE,
  sherbimi_id TEXT NOT NULL REFERENCES sherbimet (id),
  sasia INTEGER NOT NULL CHECK (sasia BETWEEN 1 AND 20),
  PRIMARY KEY (porosia_id, sherbimi_id)
);

INSERT INTO sherbimet (id, kategoria, emri, pershkrimi, cmimi_euro, njesia) VALUES
  ('kemishe', 'Veshje', 'Këmishë', 'Pastrim dhe hekurosje.', 1.50, 'copë'),
  ('bluze', 'Veshje', 'Bluzë / triko', 'Pastrim i butë.', 2.50, 'copë'),
  ('pantallona', 'Veshje', 'Pantallona', 'Pastrim dhe hekurosje.', 3.00, 'copë'),
  ('fustan', 'Veshje', 'Fustan', 'Pastrim kimik dhe hekurosje.', 6.00, 'copë'),
  ('xhakete', 'Veshje', 'Xhaketë', 'Pastrim kimik.', 5.00, 'copë'),
  ('kostum', 'Veshje', 'Kostum (2 pjesë)', 'Xhaketë dhe pantallona.', 8.00, 'copë'),
  ('pallto', 'Veshje', 'Pallto / mantel', 'Pastrim kimik.', 8.00, 'copë'),
  ('perde', 'Shtëpi', 'Perde (një krah)', 'Pastrim dhe hekurosje.', 4.00, 'copë'),
  ('batanije', 'Shtëpi', 'Batanije / jorgan', 'Pastrim kimik, thahet plotësisht.', 8.00, 'copë')
ON CONFLICT (id) DO NOTHING;

SELECT id, kategoria, emri, cmimi_euro FROM sherbimet ORDER BY kategoria, emri;
