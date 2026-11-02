-- user can send peer_request
-- when user accept it, delete a record from peer_requests
-- if user send request to a user that did that is not possible

CREATE TABLE peers (
	fk_peer_id1
	BIGINT UNSIGNED,
	
	fk_peer_id2
	BIGINT UNSIGNED,

	FOREIGN KEY (fk_peer_id1)
	REFERENCES users(id),

	FOREIGN KEY (fk_peer_id2)
	REFERENCES users(id),

	PRIMARY KEY (fk_peer_id1, fk_peer_id2)
);

CREATE TABLE peer_requests (
	fk_sender_id
	BIGINT UNSIGNED,

	fk_recipient_id
	BIGINT UNSIGNED,

	date
	DATETIME NOT NULL,

	FOREIGN KEY (fk_sender_id)
	REFERENCES users(id),

	FOREIGN KEY (fk_recipient_id)
	REFERENCES users(id),

	PRIMARY KEY (fk_sender_id, fk_recipient_id)
);
