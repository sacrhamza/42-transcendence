#!/usr/bin/env bash

# NOTE: there must be elastic_password in /run/secrets/elastic_password
# if not, the script exit fail

# set -ue

PASSWORD_FILE="/run/secrets/elastic_password"

die() {
  printf "%s" "$@" 2>&1
  exit 1
}

# NOTE: alpine sh and command echo does have -e support
# for that supress shellcheck error for echo
log() {
  if [ "${DEVOLEPMENT}" = "true" ]
  then
    /bin/echo -e  "\033[35mKIBANA: \033[33m[$(date '+%Y-%m-%d %H:%M:%S')] \033[32m[$*]\033[0m"
  else
    printf  "tokens-generator: [%s] $*" "$(date '+%Y-%m-%d %H:%M:%S')"
  fi
}

# check if there is the password, is regular file
# and the user can read it
if [ ! -f "${PASSWORD_FILE}" ] || [ ! -r "$PASSWORD_FILE" ]
then
  die "elastic password file is either not exist or don't have read access"
fi

# $(<) is undefined in sh
# but in bash you can use $(<) which is faster
# then $(cat file) source=>
# https://www.gnu.org/software/bash/manual/html_node/Command-Substitution.html
# note: when assigning there is no word splitting
ELASTIC_PASSWORD=$(cat "${PASSWORD_FILE}")

if [ -z "$(printf "%s" "${ELASTIC_PASSWORD}" | tr -d '\n\t \r')" ]
then
  die "String is empty or contains only spaces"
fi

CRED_DIR='/run/secrets/'
KIBANA_TOKENS_DIR="${CRED_DIR}/kibana"
LOGSTASH_TOKENS_DIR="${CRED_DIR}/logstash"

# compinason of elastic user password for curl to work
USER_PASSWORD_PAIR="elastic:${ELASTIC_PASSWORD}"

# elastic server url
ELASTIC_HOST="http://elastic:${ELASTIC_PORT}"

KIBANA_CRED_ROUTE=""

ping_elastic() {
  curl -u "${USER_PASSWORD_PAIR}" "elastic:${ELASTIC_PORT}"
}

token_created() {
  local token_name="$1"
  local service="$2"
  route="${ELASTIC_HOST}/_security/service/elastic/$2/credential"
  { 
    curl --fail -s -k -u "${USER_PASSWORD_PAIR}" "${KIBANA_CRED_ROUTE}" |
    jq --exit-status --raw-output0 ".tokens.\"${token_name}\""; 
  }  2> /dev/null 1>&2
}

create_new_token() {
  local token_name="$1"
  local service="$2"
  local route="${ELASTIC_HOST}/_security/service/elastic/${service}/credential"

  # create kibana token to use to connect to elasticsearch
  curl -s --fial -k -X POST -u "${USER_PASSWORD_PAIR}" "${KIBANA_CRED_ROUTE}/token/${token_name}"
  log "token ${token_name} created"
}


# if [ ! -f "${KIBANA_TOKENS_DIR}/kibana-token" ] ||  ! token_created "kibana-token" 
# then
#   echo hey
#   log "create a new kibana token"
#   create_new_token "kibana-token"
# fi



# if [ ! -f "${KIBANA_TOKENS_DIR}/logstash-token" ]
# then
#   echo hey
# fi
