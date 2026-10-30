#!/usr/bin/env sh

set -e

die() {
  echo "$@" 1>&2
  exit 1
}

# usage: log text text text, print anything passed to this function in stdout
# and print also time
# ex: log "create init file"
log() {
  if [ "${PRODUCTION}" = "true" ]
  then
    printf  "\033[35mPOSTGRES_LOG: \033[33m[%s] \033[32m$*\033[0m" "$(date '+%Y-%m-%d %H:%M:%S')"
  else
    printf  "POSTGRES_LOG: [%s] $*" "$(date '+%Y-%m-%d %H:%M:%S')"
  fi
  echo
}

log "source secrets"
. /run/secrets/suf_password
. /run/secrets/suf_user


main() {
  if [ ! -f /run/secrets/suf_password ] || [ ! -f /run/secrets/suf_user ]
  then
    die "suf_password or suf_user files are not exist in /run/secrets"
  fi

  log "check env vars SUF_USER, SUF_PASSWORD"
  : "${SUF_USER:?SUF_USER is required}"
  : "${SUF_PASSWORD:?SUF_PASSWORD is required}"

  # export PGUSER because docker-entrypoint.sh file does not export it,
  # PGPASSWORD is exported so i don't need to reexport it (from docker-entrypoint.sh)
  # but i have POSTGRES_USER
  export PGUSER="${POSTGRES_USER}"

  export  PGDATABASE="${POSTGRES_DB}"

  # TODO: in future change priv to just what backend needs not all priv
  # for example: backend does not need to delete a database or tableREVOKE
  # for now i think it needs: SELECT, DELETE, UPDATE, CONNECT
  # NOTE: single quotes for values, and double quotes for columns,user names, databases and so on;
  log "create suf user and grant privileges on database ${POSTGRES_DB}"
  psql -v ON_ERROR_STOP=1 --no-password --no-psqlrc -c \
    "CREATE USER \"${SUF_USER}\" WITH PASSWORD '${SUF_PASSWORD}';
  GRANT ALL PRIVILEGES ON DATABASE \"${POSTGRES_DB}\" TO \"${SUF_USER}\";"
}

main "$@"
