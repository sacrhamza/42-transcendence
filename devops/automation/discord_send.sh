#!/usr/bin/env bash

set -e

valid_text() {
	[[ "$1" =~ ^[[:space:]]*$ ]] && { echo "got empty string" 1>&2 && exit 1; }
}

to_safe_json() {
	valid_text "$1"
	text=$(printf "%s" "$1" | sed -e ':a' -e 'N' -e 's/\n/\\n/g')
	echo -n "$text"
}

send_file() {
	path_to_file="$1"
	if [[ ! -e "${path_to_file}" ]] 
	then
		echo "no file: ${path_to_file}" 1>&2
		exit 1
	fi
	curl -F "content=@${path_to_file}" -X POST ${DISCORD_HOOK}
}

send_text() {
	text=$(to_safe_json "$1")
	echo $text
	curl -H "Content-Type: application/json" -X POST -d "{\"content\": \"${text}\"}" ${DISCORD_HOOK}
}
