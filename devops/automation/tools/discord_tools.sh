#!/usr/bin/env bash

set -e

valid_text() {
	if [[ "$1" =~ ^[[:space:]]*$ ]]
		then
			echo "got empty string" 1>&2 && exit 1;
	fi
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
	curl -F "content=@${path_to_file}" -X POST "${DISCORD_HOOK}"
}

send_text() {
	text=$(to_safe_json "$1")
	curl -H "Content-Type: application/json" -X POST -d "{\"content\": \"${text}\"}" "${DISCORD_HOOK}"
}

commit() {
  local payload

  payload=$(jq -n \
    --arg repo "$REPO" \
    --arg branch "${BRANCH}" \
    --arg author "${AUTHOR}" \
    --arg commit "${COMMIT}" \
    --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{
      embeds: [{
        title: "🚀 New commit pushed!",
        description: ("A new commit was pushed to **" + $repo + "**."),
        color: 2383104,
        fields: [
          {
            name: "Branch",
            value: ("`" + $branch + "`"),
            inline: true
          },
          {
            name: "Author",
            value: $author,
            inline: true
          },
          {
            name: "Commit",
            value: $commit,
            inline: false
          }
        ],
        footer: {
          text: "GitHub Actions"
        },
        timestamp: $timestamp
      }]
    }')

  curl -i \
    -H "Content-Type: application/json" \
    -X POST \
    -d "$payload" \
    "$DISCORD_HOOK/github"
}
