CREATE TABLE expenses (
    id                         BIGSERIAL PRIMARY KEY,
    trip_id                    BIGINT         NOT NULL REFERENCES trips (id) ON DELETE CASCADE,
    descricao                  VARCHAR(150)   NOT NULL,
    categoria                  VARCHAR(20)    NOT NULL,
    valor_centavos             BIGINT         NOT NULL CHECK (valor_centavos > 0),
    moeda                      VARCHAR(3)     NOT NULL,
    -- 1 unidade de "moeda" = taxa_cambio unidades da moeda da viagem
    taxa_cambio                NUMERIC(20, 8) NOT NULL,
    valor_convertido_centavos  BIGINT         NOT NULL,
    data                       DATE           NOT NULL,
    pago_por                   BIGINT         NOT NULL REFERENCES users (id),
    modo_divisao               VARCHAR(10)    NOT NULL,
    criado_por                 BIGINT         REFERENCES users (id) ON DELETE SET NULL,
    atualizado_por             BIGINT         REFERENCES users (id) ON DELETE SET NULL,
    criado_em                  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    atualizado_em              TIMESTAMPTZ    NOT NULL DEFAULT now(),
    version                    INTEGER        NOT NULL DEFAULT 0
);

CREATE INDEX expenses_trip_idx ON expenses (trip_id, data DESC);

-- Quanto cada pessoa "consumiu" da despesa, na moeda original e convertido para a moeda da viagem.
CREATE TABLE expense_splits (
    expense_id                 BIGINT NOT NULL REFERENCES expenses (id) ON DELETE CASCADE,
    user_id                    BIGINT NOT NULL REFERENCES users (id),
    valor_centavos             BIGINT NOT NULL,
    valor_convertido_centavos  BIGINT NOT NULL,
    PRIMARY KEY (expense_id, user_id)
);
