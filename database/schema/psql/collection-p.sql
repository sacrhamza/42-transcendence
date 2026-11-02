CREATE TABLE collections (

    id
    BIGSERIAL
    PRIMARY KEY,

    description
    VARCHAR(500)
    NOT NULL,

    image
    VARCHAR(100)
    DEFAULT 'default_image'

);

CREATE TABLE ft_projects (
    id
    BIGSERIAL
    PRIMARY KEY,

    name
    VARCHAR(100)
    UNIQUE
    NOT NULL,

    intra_id
    BIGSERIAL
    UNIQUE,

    fk_collection_id
    BIGSERIAL
    UNIQUE,

    FOREIGN KEY (fk_collection_id)
    REFERENCES collections (id)

);

CREATE TABLE projects (

    -- here ft_collection_id and fk_owner_id can be primary key
    id
    BIGSERIAL
    PRIMARY KEY,

    name
    VARCHAR(100)
    UNIQUE
    NOT NULL,

    fk_collection_id
    BIGSERIAL
    UNIQUE,

    fk_owner_id
    BIGSERIAL,

    FOREIGN KEY (fk_collection_id)
    REFERENCES collections (id),

    FOREIGN KEY (fk_owner_id)
    REFERENCES users (id)

);


-- here ft_collection_id and fk_owner_id can be primary key
CREATE TABLE community (

    id
    BIGSERIAL
    PRIMARY KEY,

    name
    VARCHAR(100)
    UNIQUE
    NOT NULL,

    fk_collection_id
    BIGSERIAL
    UNIQUE,

    fk_owner_id
    BIGSERIAL,

    FOREIGN KEY (fk_collection_id)
    REFERENCES collections (id),

    FOREIGN KEY (fk_owner_id)
    REFERENCES users (id)

);
