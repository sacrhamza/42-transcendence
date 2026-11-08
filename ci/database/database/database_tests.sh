#!/usr/bin/env bash

# cd /run/secrets; source ./suf_user; source ./suf_password
# export PGUSER=$SUF_USER PG_PASSWORD=$SUF_PASSWORD
# psql -h postgresql  $POSTGRES_DB

source /run/secrets/suf_user
source /run/secrets/suf_password

export PGUSER="$SUF_USER" PGPASSWORD="$SUF_PASSWORD"

run() {
  echo "## $TITLE"
  echo "### COMMAND"
  output=$("$@" 2>&1)
  code=$?
  echo '```shell'
  if [ $code = 0 ]
  then
    printf "✅"
  else
    printf "❌"
  fi
  echo "$@"
  echo '```'
  echo "### OUTPUT"
  echo '```tex'
  echo "$output"
  echo '```'
  if [ $code -ne 0 ]
  then
    exit
  fi
}

run_psql() {
  run psql -d "$POSTGRES_DB" -c "$@"
}

test_users() {
  TITLE='postgres'

  # insert
  DESCRIPTION='test insert' run_psql  "WITH i AS (
    INSERT INTO users(name, profile_image, bio, deleted)
    VALUES('root', '/var/www/image', 'i love to code', FALSE)
    RETURNING id
  )
  INSERT INTO normal_users(fk_user_id, mail, password)
  SELECT id,'mail','pass'
    FROM i;"

    # update priv
   run_psql "UPDATE users SET name = 'newname',bio = 'new bio'
  where name = 'root';
  "

  # test delete priv
  run_psql "DELETE FROM normal_users WHERE mail = 'mail';
  DELETE FROM users WHERE name = 'newname';"
}

test_users
