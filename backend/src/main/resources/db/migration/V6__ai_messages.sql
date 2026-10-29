CREATE TABLE ai_messages (
    id          BIGSERIAL PRIMARY KEY,
    trip_id     BIGINT      NOT NULL REFERENCES trips (id) ON DELETE CASCADE,
    -- autor da pergunta; NULL nas respostas da IA
    user_id     BIGINT      REFERENCES users (id) ON DELETE SET NULL,
    role        VARCHAR(10) NOT NULL,
    conteudo    TEXT        NOT NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_messages_trip_idx ON ai_messages (trip_id, id);
