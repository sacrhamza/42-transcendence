#!/usr/bin/env bash

PARENT_DIR=$(dirname "$0")

source "$PARENT_DIR/discord_tools.sh"

send_to_all_channels() {
  DISCORD_HOOK="$FRONTEND_HOOK" commit
  DISCORD_HOOK="$BACKEND_HOOK" commit
  DISCORD_HOOK="$DATABASE_HOOK" commit
}

export DISCROD_HOOK

case "${BRANCH}" in
  'main') send_to_all_channels
          exit ;;
  'devops') DISCORD_HOOK="$DEVOPS_HOOK"
          "$PARENT_DIR/send.sh" -t '@everyone : new commit';;
  'backend' | 'feature/authentication' | 'feature/friends') DISCORD_HOOK="$BACKEND_HOOK";;
  'frontend') DISCORD_HOOK="$FRONTEND_HOOK";;
  'database') DISCORD_HOOK="$DATABASE_HOOK";;
esac

commit
