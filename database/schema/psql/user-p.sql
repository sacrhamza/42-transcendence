-- # FUNCTIONS, create normal_user
-- INSERT INTO users(id, name, profile_image, user_join_date, bio, updated_date, deleted) VALUES(DEFAULT, user.name, DEFAULT, user.bio);
-- INSERT INTO normal_users VLAUES (LAST_INSERT_ID(), user.mail, user.password);


-- # create 42 users
-- INSERT INTO users(name, profile_image, bio) VALUES(user.name, user.image_url, user.bio);
-- INSERT INTO ft_users VLAUES (LAST_INSERT_ID());

-- # delete user
-- # change user info

CREATE TABLE users (
    id
    BIGSERIAL
    PRIMARY KEY,

    name
    VARCHAR(75)
    NOT NULL UNIQUE,

    profile_image
    TEXT DEFAULT 'default_image'
    NOT NULL,

    user_join_date
    DATE DEFAULT CURRENT_DATE
    NOT NULL,

    bio
    TEXT
    NOT NULL,

    updated_date
    DATE DEFAULT CURRENT_DATE
    NOT NULL,

    deleted
    BOOLEAN DEFAULT FALSE
    NOT NULL
);

CREATE TABLE ft_users (
    fk_user_id
    BIGSERIAL,

    intra_id
    BIGSERIAL
    PRIMARY KEY,

    FOREIGN KEY (fk_user_id)
    REFERENCES users (id)
);

CREATE TABLE normal_users (
    fk_user_id
    BIGSERIAL,

    mail
    VARCHAR(50)
    PRIMARY KEY,

    password
    VARCHAR(100)
    NOT NULL,

    FOREIGN KEY (fk_user_id)
    REFERENCES users (id)
);

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
