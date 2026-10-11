#!/usr/bin/env sh

for file in '/etc/prometheus/templates/'*.template
do
	filename="$(basename "$file")"
	configfile="${filename%.template}"

	envsubst < "$file" > "${configfile}"
done

exec /bin/prometheus "$@"
