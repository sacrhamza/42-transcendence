#!/usr/bin/env bash

set -eu

# declare -A actions
#
compose() {
  docker compose -f ./docker-compose.yml "$@"
}

run_for_each() {
  local -n cmd="$1"
  local -n srvs="$2"
  for service in "${srvs[@]}"
  do
    "${cmd[@]}" "$service"
  done
}

up() {
  # shellcheck disable=SC2034
  command=(compose up --build -d) services=("$@")
  len=${#services[@]}
  if [ "$len" -eq 0 ]
  then
    "${command[@]}"
  else
    run_for_each command services
  fi
}

down() {
  # shellcheck disable=SC2034
  command=(compose down) services=("$@")
  len=${#services[@]}
  if [ "$len" -eq 0 ]
  then
    "${command[@]}"
  else
    run_for_each command services
  fi
}

re() {
  down "${@}"
  up "${@}"
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
  up [services]: create and start container
    Note: if you run ./script.sh up it is like running:
      docker compose up --build

  down [services]: stops and remove containers, networks

  logs [service_name]: get logs about services

  re [service_name]: up and then down a services, [re]start

  logs [service_name]: get services logs

  clean: down all services and remove volumes

  fclean: like clean but it removes also images

  wipe_out: remove anything related to docker(images,networks,volumes,build cache..)
  "
}

function main() {
  if [[ $# -eq 0 ]] || [[ "$1" != @('up'|'down'|'clean'|'logs'|'fclean'|'wipe_out'|'re') ]]
	then
    help
    exit 1
	fi
  args=("$@")
  "$1" "${args[@]:1}"
}

main "$@"
