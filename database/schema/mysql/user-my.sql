-- user table defined like: 
-- mysql
-- MAX_NAME_LEN=75
-- MAX_MAIL_LEN=50
-- MAX_PASSWORD_LEN=100
-- HASHED_PASSWORD_LEN=64

-- INSERT INTO users(id, name, profile_image, user_join_date, bio, updated_date, deleted) VALUES(DEFAULT, user.name, DEFAULT, user.bio);
-- INSERT INTO normal_users VLAUES (LAST_INSERT_ID(), user.mail, user.password);


-- # create 42 users
-- INSERT INTO users(name, profile_image, bio) VALUES(user.name, user.image_url, user.bio);
-- INSERT INTO ft_users VLAUES (LAST_INSERT_ID());

CREATE TABLE users (
	id 
	BIGINT UNSIGNED 
	PRIMARY KEY AUTO_INCREMENT,

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
	BIGINT UNSIGNED
	NOT NULL,

	FOREIGN KEY (fk_user_id)
	REFERENCES users(id)
);

CREATE TABLE normal_users (
	fk_user_id
	BIGINT UNSIGNED
	NOT NULL,

	mail 
	VARCHAR(50)
	NOT NULL UNIQUE,

	password 
	VARCHAR(100)

	NOT NULL,

	FOREIGN KEY (fk_user_id)
	REFERENCES users(id)
);

