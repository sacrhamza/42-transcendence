CREATE TABLE refresh_sessions (
      id
      BIGSERIAL
      PRIMARY KEY,

      fk_user_id
      BIGINT
      NOT NULL,

      jti
      VARCHAR(36) 
      DEFAULT UUIDV7()
      NOT NULL,

      token_hash
      TEXT 
      NOT NULL
      UNIQUE,

      created_at
      TIMESTAMP WITH TIME ZONE
      DEFAULT CURRENT_TIMESTAMP(2)
      NOT NULL,

      expires_at
      TIMESTAMP WITH TIME ZONE
      NOT NULL,

      FOREIGN KEY (fk_user_id)
      REFERENCES users(id)
);
