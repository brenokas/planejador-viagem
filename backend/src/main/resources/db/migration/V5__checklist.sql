CREATE TABLE checklist_items (
    id              BIGSERIAL PRIMARY KEY,
    trip_id         BIGINT       NOT NULL REFERENCES trips (id) ON DELETE CASCADE,
    tipo            VARCHAR(10)  NOT NULL,
    texto           VARCHAR(200) NOT NULL,
    feito           BOOLEAN      NOT NULL DEFAULT FALSE,
    -- NULL = sem responsável definido
    responsavel_id  BIGINT       REFERENCES users (id) ON DELETE SET NULL,
    prazo           DATE,
    feito_por       BIGINT       REFERENCES users (id) ON DELETE SET NULL,
    criado_por      BIGINT       REFERENCES users (id) ON DELETE SET NULL,
    criado_em       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    version         INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX checklist_items_trip_idx ON checklist_items (trip_id, tipo);
