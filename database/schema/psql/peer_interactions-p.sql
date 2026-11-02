CREATE TABLE peers (
    fk_peer_id1
    BIGSERIAL,

    fk_peer_id2
    BIGSERIAL,

    FOREIGN KEY (fk_peer_id1)
    REFERENCES users (id),

    FOREIGN KEY (fk_peer_id2)
    REFERENCES users (id),

    PRIMARY KEY (fk_peer_id1, fk_peer_id2)
);

CREATE TABLE peer_requests (
    fk_sender_id
    BIGSERIAL,

    fk_recipient_id
    BIGSERIAL,

    date
    TIMESTAMP NOT NULL,

    FOREIGN KEY (fk_sender_id)
    REFERENCES users (id),

    FOREIGN KEY (fk_recipient_id)
    REFERENCES users (id),

    PRIMARY KEY (fk_sender_id, fk_recipient_id)
);
