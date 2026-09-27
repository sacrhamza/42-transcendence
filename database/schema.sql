-- user table defined like: 
-- mysql
-- MAX_NAME_LEN=75
-- MAX_MAIL_LEN=50
-- MAX_PASSWORD_LEN=100
CREATE TABLE user (
	id bigint AUTO_INCREMENT primary key,
	name VARCHAR($MAX_NAME_LEN) NOT NULL UNIQUE,
	mail VARCHAR($MAX_MAIL_LEN) NOT NULL UNIQUE,
	password VARCHAR(100) NOT NULL UNIQUE,
	profile_image TEXT -- can be NULL
	about_me TEXT, -- can be NULL
);



-- postgresql
CREATE TABLE user (
	id BIGSERIAL primary key,
	name varchar($MAX_NAME_LEN) NOT NULL UNIQUE,        -- name max character is 100 character
	mail VARCHAR($MAX_MAIL_LEN) NOT NULL UNIQUE,
	password VARCHAR(100) NOT NULL UNIQUE,
	profile_image TEXT, -- can be NULL
	about_me TEXT,
);
