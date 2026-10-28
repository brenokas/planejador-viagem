CREATE TABLE trips (
    id                  BIGSERIAL PRIMARY KEY,
    titulo              VARCHAR(120) NOT NULL,
    destino             VARCHAR(200) NOT NULL,
    data_inicio         DATE         NOT NULL,
    data_fim            DATE         NOT NULL,
    moeda               VARCHAR(3)   NOT NULL DEFAULT 'BRL',
    orcamento_centavos  BIGINT,
    capa_url            VARCHAR(1000),
    arquivada           BOOLEAN      NOT NULL DEFAULT FALSE,
    criado_por          BIGINT       NOT NULL REFERENCES users (id),
    criado_em           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    version             INTEGER      NOT NULL DEFAULT 0,
    CONSTRAINT trips_periodo_valido CHECK (data_fim >= data_inicio)
);

CREATE TABLE trip_members (
    trip_id   BIGINT      NOT NULL REFERENCES trips (id) ON DELETE CASCADE,
    user_id   BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    papel     VARCHAR(10) NOT NULL,
    entrou_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (trip_id, user_id)
);

CREATE INDEX trip_members_user_idx ON trip_members (user_id);

CREATE TABLE trip_invites (
    id          BIGSERIAL PRIMARY KEY,
    trip_id     BIGINT      NOT NULL REFERENCES trips (id) ON DELETE CASCADE,
    token       VARCHAR(64) NOT NULL UNIQUE,
    criado_por  BIGINT      NOT NULL REFERENCES users (id),
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expira_em   TIMESTAMPTZ NOT NULL,
    usado_por   BIGINT      REFERENCES users (id),
    usado_em    TIMESTAMPTZ
);
