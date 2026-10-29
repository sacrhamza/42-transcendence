#!/bin/bash
set -e

for file in "$TEMPLATES_DIR"/*
do
	envsubst < "$file" | mariadb --user=root --password="${MARIADB_ROOT_PASSWORD}"
done
