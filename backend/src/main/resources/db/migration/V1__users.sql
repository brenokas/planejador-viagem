CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    senha_hash  VARCHAR(100) NOT NULL,
    avatar_url  VARCHAR(500),
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
