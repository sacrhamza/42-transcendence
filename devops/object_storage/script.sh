#!/usr/bin/env bash

set -e

declare -A actions

actions['up']="docker compose --env-file './prometheus/prometheus.compose.env' --env-file .env up --build"
actions['down']="docker compose  --env-file './prometheus/prometheus.compose.env' --env-file .env down"
actions['clean']=""
actions['fclean']=""
actions['up-detached']=""

function die() {
	echo "$@" 1>&2
	exit 1
}

function main() {
	if [[ $# -ne 1 ]]
	then
		die "got $# args, expect just 1"
	fi
	case "$1" in
		'up' | 'down') bash -c "${actions[$1]}";;
		*) die "error unknow option '$1'";;
	esac
}

main "$@"
