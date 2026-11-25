-- Pastrim kimik · tabelat. Ekzekuto në Neon SQL Editor (databaza jote, jo e profesorit).
-- Emrat e shërbimeve dhe kategoritë më poshtë janë SHEMBUJ. Zëvendësoji me listën reale të dyqanit.
-- Çmimet janë NULL me qëllim: vetëm pronari i di çmimet reale [PLOTËSO].

-- konto_id = 'google:<numri>' ose 'github:<numri>' (ofruesi + ID e llogarisë).
CREATE TABLE IF NOT EXISTS perdoruesit (
  konto_id TEXT PRIMARY KEY,
  emri TEXT NOT NULL,
  roli TEXT NOT NULL DEFAULT 'klient' CHECK (roli IN ('klient', 'pronar'))
);

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

INSERT INTO sherbimet (id, kategoria, emri, pershkrimi, njesia) VALUES
  ('kemishe', 'Veshje', 'Këmishë', 'Pastrim dhe hekurosje.', 'copë'),
  ('pantallona', 'Veshje', 'Pantallona', 'Pastrim dhe hekurosje.', 'copë'),
  ('kostum', 'Veshje', 'Kostum (2 pjesë)', 'Xhaketë dhe pantallona.', 'copë'),
  ('xhakete', 'Veshje', 'Xhaketë / pallto', 'Pastrim kimik.', 'copë'),
  ('perde', 'Shtëpi', 'Perde', 'Pastrim dhe hekurosje.', 'copë'),
  ('batanije', 'Shtëpi', 'Batanije / jorgan', 'Pastrim kimik.', 'copë')
ON CONFLICT (id) DO NOTHING;

SELECT id, kategoria, emri, cmimi_euro FROM sherbimet ORDER BY kategoria, emri;
