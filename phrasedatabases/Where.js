{
  "data": [
    {
      "phrase": [
        "Where are (item)",
        "Where are the (item)",
        "Where are the (item) at"
      ],
      "response": [
        "The (item) are in (column) (value)"
      ],
      "continue": [
        "(item) are in (column) (value)"
      ],
      "negative": [
        "I can't find the (item)."
      ],
      "phraseType": "query",
      "implies": [
        "place"
      ],
      "storage": "standardQuestion",
      "target": [
        "item"
      ],
      "meta": {
        "style": [
          "definite",
          "plural"
        ],
        "group": "location"
      }
    },
    {
      "phrase": [
        "Where can I find the (item)"
      ],
      "response": [
        "You can find the (item) in (column) (value)"
      ],
      "continue": [
        "(item) in (column) (value)"
      ],
      "negative": [
        "I can't find the (item)",
        "It seems we don't have (item)"
      ],
      "phraseType": "query",
      "implies": [
        "place"
      ],
      "target": [
        "item"
      ],
      "storage": "standardQuestion",
      "meta": {
        "style": [
          "definite"
        ],
        "group": "location"
      }
    },
    {
      "phrase": [
        "Where can I find the (item)"
      ],
      "response": [
        "You can find the (item) in (value)"
      ],
      "continue": [
        "(item) in (value)"
      ],
      "negative": [
        "I can't find the (item)",
        "It seems we don't have (item)"
      ],
      "phraseType": "query",
      "implies": [
        "place"
      ],
      "target": [
        "item"
      ],
      "storage": "inHiddenColumn",
      "meta": {
        "style": [
          "definite",
          "2wc"
        ],
        "group": "location"
      }
    },
    {
      "phrase": [
        "Where is (item)"
      ],
      "response": [
        "(item) is in (column) (value)"
      ],
      "negative": [
        "There is no (item)",
        "I don't know"
      ],
      "phraseType": "query",
      "implies": [
        "place"
      ],
      "target": [
        "item"
      ],
      "storage": "standardQuestion",
      "meta": {
        "style": [
          "indefinite"
        ],
        "group": "location"
      }
    }
  ]
}