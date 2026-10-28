CREATE TABLE activities (
    id              BIGSERIAL PRIMARY KEY,
    trip_id         BIGINT        NOT NULL REFERENCES trips (id) ON DELETE CASCADE,
    titulo          VARCHAR(150)  NOT NULL,
    -- NULL = "Ideias" (ainda sem dia definido)
    data            DATE,
    hora_inicio     TIME,
    hora_fim        TIME,
    categoria       VARCHAR(20)   NOT NULL,
    local_nome      VARCHAR(300),
    lat             DOUBLE PRECISION,
    lng             DOUBLE PRECISION,
    custo_centavos  BIGINT,
    notas           TEXT,
    ordem           INTEGER       NOT NULL DEFAULT 0,
    criado_por      BIGINT        REFERENCES users (id) ON DELETE SET NULL,
    atualizado_por  BIGINT        REFERENCES users (id) ON DELETE SET NULL,
    criado_em       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    version         INTEGER       NOT NULL DEFAULT 0,
    CONSTRAINT activities_coords CHECK ((lat IS NULL) = (lng IS NULL))
);

CREATE INDEX activities_trip_idx ON activities (trip_id, data, ordem);
