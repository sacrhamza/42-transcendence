-- user table defined like: 
-- mysql
-- MAX_NAME_LEN=75
-- MAX_MAIL_LEN=50
-- MAX_PASSWORD_LEN=100
-- HASHED_PASSWORD_LEN=64

CREATE TABLE user (
	id 
	varchar(32) 
	primary key DEFAULT REPLACE(UUID_v7(), '-', ''), -- change id type from bigint to uuid_v7 which is the best option here

	name 
	VARCHAR($MAX_NAME_LEN)
	NOT NULL UNIQUE,

	mail 
	VARCHAR($MAX_MAIL_LEN)
	NOT NULL UNIQUE,

	password 
	VARCHAR(100)
	NOT NULL,

	profile_image 
	TEXT -- can be NULL

	about_me 
	TEXT, -- can be NULL

	user_join_date 
	DATE 
	NOT NULL
);

CREATE TABLE friends (
	id 
	varchar(32) NOT NULL,

	friend_id 
	varchar(32) NOT NULL,

	CONSTRAINT fk_id FOREIGN KEY (id)
	REFERENCES user(id)
	ON DELETE CASCADE,

	CONSTRAINT fk_friend_id FOREIGN KEY (friend_id)
	REFERENCES user(id)
	ON DELETE CASCADE,
);



-- postgresql
CREATE TABLE user (
	id varchar(32) primary key DEFAULT REPLACE(uuidv7()::text, '-', ''),
	name varchar($MAX_NAME_LEN) NOT NULL UNIQUE,        -- name max character is 100 character
	mail VARCHAR($MAX_MAIL_LEN) NOT NULL UNIQUE,
	password VARCHAR(100) NOT NULL UNIQUE,
	profile_image TEXT, -- can be NULL
	about_me TEXT,
	user_join_date DATE NOT NULL
);
