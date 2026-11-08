WITH i AS (
  INSERT INTO users(name, profile_image, bio, deleted)
  VALUES('root', '/var/www/image', 'i love to code', FALSE)
  RETURNING id
)
  INSERT INTO normal_users(fk_user_id, mail, password)
SELECT id,'mail','pass'
FROM i;

-- update
UPDATE users SET name = 'newname',bio = 'new bio'
where name = 'root';


-- delete
DELETE FROM normal_users WHERE mail = 'mail';
DELETE FROM users WHERE name = 'newname';
