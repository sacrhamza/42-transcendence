CREATE TABLE discussion_posts (
    id
    BIGSERIAL
    PRIMARY KEY,

    fk_post_id
    BIGSERIAL
    UNIQUE,

    fk_collection_id
    BIGSERIAL,

    FOREIGN KEY (fk_post_id)
    REFERENCES posts (id),

    FOREIGN KEY (fk_collection_id)
    REFERENCES collections (id)
);

CREATE TABLE posts (
    id
    BIGSERIAL
    PRIMARY KEY,

    fk_ugc_id
    BIGSERIAL,

    FOREIGN KEY (fk_ugc_id)
    REFERENCES ugc (id)
);


CREATE TABLE ugc (
    id
    BIGSERIAL
    PRIMARY KEY,

    content
    TEXT
    NOT NULL,

    fk_owner_id
    BIGSERIAL,

    edited
    BOOLEAN
    NOT NULL
    DEFAULT FALSE,

    fk_react_id
    BIGSERIAL,

    posted_date
    TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_DATE,

    updated_date
    TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_DATE,

    FOREIGN KEY (fk_owner_id)
    REFERENCES users (id),

    FOREIGN KEY (fk_react_id)
    REFERENCES reacts (id)
);


CREATE TABLE comments (
    id
    BIGSERIAL
    PRIMARY KEY,

    is_main_comment
    BOOLEAN
    NOT NULL
    DEFAULT FALSE,

    fk_parent_comment_id
    BIGINT
    NOT NULL,

    fk_ugc_id
    BIGINT
    NOT NULL,

    fk_post_id
    BIGINT
    NOT NULL,

    name
    VARCHAR(255)
    NOT NULL,

    FOREIGN KEY (fk_parent_ugc_id)
    REFERENCES ugc (id),

    FOREIGN KEY (fk_ugc_id)
    REFERENCES ugc (id),

    FOREIGN KEY (fk_post_id)
    REFERENCES posts (id)
);


CREATE TABLE likes (

    fk_user_id
    BIGSERIAL,

    fk_ugc_id
    BIGSERIAL,

    PRIMARY KEY (fk_user_id, fk_ugc_id)
);

CREATE TABLE votes (

    fk_user_id
    BIGSERIAL,

    fk_ugc_id
    BIGSERIAL,

    up
    BOOLEAN
    DEFAULT TRUE,

    PRIMARY KEY (fk_user_id, fk_ugc_id)
);
