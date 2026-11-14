#!/usr/bin/env sh

# . /run/secrets/suf_password
# . /run/secrets/suf_user
#
# export PGUSER=$SUF_USER PGPASSWORD=$SUF_PASSWORD
export PGUSER=$(cat /run/secrets/postgres_user)
export PGPASSWORD=$(cat /run/secrets/postgres_password)

sh
