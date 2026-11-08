CREATE TABLE refresh_sessions (
      id
      BIGSERIAL
      PRIMARY KEY,

      fk_user_id
      BIGSERIAL,

      token_hash
      TEXT UNIQUE
      NOT NULL,

      created_at
      DATE DEFAULT CURRENT_DATE
      NOT NULL,

      expires_at
      DATE
      NOT NULL,

      FOREIGN KEY (fk_user_id)
      REFERENCES users(id)
);
