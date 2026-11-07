#!/usr/bin/env bash

PARENT_DIR=$(dirname "$0")

export DISCORD_HOOK="$1"
"$PARENT_DIR/send.sh" -t "repo $REPO commit: $COMMIT AUTHOR: $AUTHOR"
