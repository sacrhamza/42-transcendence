#!/usr/bin/env sh

set -eu 

function die() {
	echo "$@" 1>&2
	exit 1
}

function log() {
	PURPLE='\033[35m'
	RESET='\033[0m'
	YELLOW='\033[33m'
	GREEN='\033[32m'
	echo -e "${PURPLE}PROMETHEUS: ${YELLOW}[$(date '+%Y-%m-%d %H:%M')] ${GREEN}$*${RESET}"
}


function main() {

	local PROMETHEUS_CONFIG_DIR=${PROMETHEUS_CONFIG_DIR:-/etc/prometheus/scrapes.d} \
	PROMETHEUS_TEMPLATE_DIR=${PROMETHEUS_TEMPLATE_DIR:-/etc/prometheus/templates} \
	PROMETHEUS_TEMPLATES_SUFFIX=${PROMETHEUS_TEMPLATES_SUFFIX:-.yml.template}

	local envlist=$(printf '${%s} ' $(printenv | sed 's/=.*//g'))

	mkdir /etc/prometheus/scrapes.d

	for file in "${PROMETHEUS_TEMPLATE_DIR}/"*."$PROMETHEUS_TEMPLATES_SUFFIX"
	do
		# check if file exist because of glob, *
		if [ ! -r "$file" ]
		then
			die "empty directory or can't read from $file"
		fi

		filename=$(basename "$file")
		configfile="${filename%.template}"

		log "create $configfile: success"
		envsubst "${envlist}" < "$file" > "${PROMETHEUS_CONFIG_DIR}/${configfile}"
	done

	log "running prometheus"
	exec /bin/prometheus "$@"
}


main "$@"
