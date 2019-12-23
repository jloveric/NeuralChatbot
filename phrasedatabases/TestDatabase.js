module.exports = {
  "data": [
    {
      exampleWildcards: { item: ["Sarah"], value: ["Safeway"] },
      "phrase": [
        "Where is (item)"
      ],
      "response": [
        "(item) is in (value)"
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
      "storage": {
        "phrase": {
          "get": {
            "(item):in": "(value)"
          }
        },
        "response": {
          "set": {
            "(item):in": "(value)"
          }
        }
      },
      "meta": {
        "style": [
          "indefinite",
          "2wc"
        ],
        "group": "in"
      }
    },
    {
      "phrase": [
        "Help!",
        "wtf",
        "What is this"
      ],
      "response": [
        "Here is what I know"
      ],
      "phraseType": "help",
      "implies": [
        "help"
      ],
      "target": [
        "bot"
      ],
      "meta": {
        "group": "help"
      }
    },
    {
      "phrase": ["What did I say", "What do you think I said", "What was I talking about?"],
      "phraseType": "whatsaid",
      "implies": ["whatsaid"],
      "target": ["whatsaid"],
      "meta": {
        "group": "whatsaid"
      }
    },
    {
      "phrase": ["What do you do for a living",
        "What is your job", "How do you make money"],
      "response": ["I'm batman", "sometimes I work as a fisherman"],
      "phraseType": "job",
      "implies": [
        "movie"
      ],
      "target": [
      ],
      "meta": {
        "style": [
          "nosearch"
        ],
        "group": "job"
      }
    },
    {
      "phrase": ["What is your favorite movie"],
      "response": ["Aliens"],
      "phraseType": "favorite movie",
      "implies": [
        "movie"
      ],
      "target": [
      ],
      "meta": {
        "style": [
          "nosearch"
        ],
        "group": "movie"
      }
    },
    {
      "phrase": ["do you have family?", "do you have any kids", "do you have any children"],
      "response": ["I have 32 kids, they drive me nuts."],
      "phraseType": "family",
      "implies": [
        "family"
      ],
      "target": [
      ],
      "meta": {
        "style": [
          "nosearch"
        ],
        "group": "family"
      }
    },
    {
      "phrase": ["thanks", "thx", "thank you", "danke", "gracias", "merci", "much obliged"],
      "response": ["welcome", "you're welcome", "any time", "gladly"],
      "phraseType": "thanks",
      "implies": [
        "thanks"
      ],
      "target": [
      ],
      "meta": {
        "style": [
          "nosearch"
        ],
        "group": "thanks"
      }
    },
    {
      "phrase": [
        "What is your name?",
        "What are you called?",
        "Who is this",
        "Who are you"
      ],
      "response": [
        "My name is (value)",
        "I'm called (value)"
      ],
      "negative": [
        "I have no name."
      ],
      "phraseType": "query",
      "implies": [
        "person"
      ],
      "target": [],
      "storage": "askYourName",
      "meta": {
        "group": "identity"
      }
    }]
}