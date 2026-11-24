#!/usr/bin/env sh

die() {
  printf "%s" "$1" 2>&1
  exit 1
}

PROMETHEUS_PASSWORD_FILE=/run/secrets/prometheus_password

if [ ! -f "${PROMETHEUS_PASSWORD_FILE}" ] || [ ! -r "${PROMETHEUS_PASSWORD_FILE}" ]
then
  die "prometheus password file is either not exist or don't have read access"
fi

PROMETHEUS_PASSWORD="$(cat /run/secrets/prometheus_password)"

if [ -z "$(echo "${PROMETHEUS_PASSWORD}" | tr -d '\n\t\r ')" ]
then
  die "String is empty or contains only spaces"
fi

PROMETHEUS_PASSWORD=$(tr -d '\n' </run/secrets/prometheus_password)
export PROMETHEUS_PASSWORD

exec /run.sh "$@"
