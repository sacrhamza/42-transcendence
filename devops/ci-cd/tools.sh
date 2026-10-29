#!/usr/bin/env bash

function die() {
	echo "$@" 1>&2
}

function log() {
	phase="$1"
	echo "${phase} '$(date)' "
}
