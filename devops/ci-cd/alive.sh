#!/usr/bin/env bash

set -e

# check if nginx is running
status=$(curl -s -w '%{http_code}' -L https://localhost/ping -o /dev/null)
if [[ "$status" -ne "200" ]]
then
	error
fi
