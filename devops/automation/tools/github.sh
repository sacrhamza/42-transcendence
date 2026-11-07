#!/usr/bin/env bash

PARENT_DIR=$(dirname "$0")

export DISCORD_HOOK="$1"
source "$PARENT_DIR/discord_tools.sh"


commit
