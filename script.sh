#!/usr/bin/env bash

set -e

# declare -A actions
#
compose() {
  docker compose -f ./docker-compose.yml "$@"
}

up() {
  echo "[$*]"
  compose up --build "$@" 
}

down() {
  compose down "${@}" 
}

logs() {
  compose logs "$@" 
}

die() {
  echo "$*" 1>&2
  exit 1
}

clean() {
  if [ $# -ne 0 ]
  then
    die ""
  fi
  compose down -v
}

fclean() {
  compose down -v --rmi
}

wipe_out() {
  # remove all conainers
  containers=($(docker ps -qa))
  [[ "${#containers}" -ne 0 ]] &&\
    docker stop "${containers[@]}" && \
    docker rm "${containers[@]}"

  # remove all images
  images=($(docker images -qa))
  [[ "${#images}" -ne 0 ]] && docker rmi "${images[@]}"

  # to do: for now removing all networks
  # result an error: system networks
  # remove all networks
  networks=($(docker network ls -q))
  [[ "${#images}" -ne 0 ]] && docker network rm "${networks[@]}"

  # remove all volumes

}

help() {
  printf "
  usage: ./script.sh [option]
  up [service_name]: create and start container
    Note: if you run ./script.sh up it is like running:
      docker compose up --build

  down [service_name]: stops and remove containers, networks

  logs [service_name]: get logs about a service name
  "
}

function main() {
  if [[ $# -eq 0 ]] || [[ "$1" != @('up'|'down'|'clean'|'logs'|'fclean'|'wipe_out') ]]
	then
    help
    exit 1
	fi
  args=("$@")
  "$1" "${args[@]:1}"
}

main "$@"
