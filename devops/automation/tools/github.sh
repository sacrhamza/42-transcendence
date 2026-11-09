#!/usr/bin/env bash

PARENT_DIR=$(dirname "$0")

source "$PARENT_DIR/discord_tools.sh"

case "${BRANCH}" in
  'devops') DISCORD_HOOK="$DEVOPS_HOOK";;
  'backend') DISCORD_HOOK="$BACKEND_HOOK";;
  'frontend') DISCORD_HOOK="$FRONTEND_HOOK";;
  'database') DISCORD_HOOK="$DATABASE_HOOK";;
esac

commit
