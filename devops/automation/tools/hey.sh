
curl -i -H "Content-Type: application/json" -X POST -d " {
  "embeds": [
    {
      "title": "🚀 New commit pushed!",
      "description": "A new commit was pushed to **test**.",
      "color": 2383104,
      "fields": [
        {
          "name": "Branch",
          "value": ``,
          "inline": true
        },
        {
          "name": "Author",
          "value": "test",
          "inline": true
        },
        {
          "name": "Commit",
          "value": "test",
          "inline": false
        }
      ],
      "footer": {
        "text": "GitHub Actions"
      },
    "timestamp": "2026-11-07T19:53:04UTC"
    }
  ]
}

