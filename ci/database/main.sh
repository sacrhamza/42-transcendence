#!/usr/bin/env bash

set -eu

# run() {
#   echo "## $TITLE"
#   echo "### COMMAND"
#   output=$("$@" 2>&1)
#   code=$?
#   echo '```shell'
#   if [ $code = 0 ]
#   then
#     printf "✅"
#   else
#     printf "❌"
#   fi
#   echo "$@"
#   echo '```'
#   echo "### OUTPUT"
#   echo '```tex'
#   echo "$output"
#   echo '```'
#   if [ $code -ne 0 ]
#   then
#     exit
#   fi
# }

test_postgres() {
  docker cp /work/database_tests.sh postgresql:/tmp/
  docker cp ./users.sql postgresql:/tmp/
  docker exec -it postgresql /tmp/database_tests.sh > "./logs/users-$(date -u +%Y-%m-%d-%H:%M:%S).md"
}

test_postgres
