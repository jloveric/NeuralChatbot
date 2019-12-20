[![Build Status](https://travis-ci.org/jloveric/NeuralChatbot.svg?branch=master)](https://travis-ci.org/jloveric/NeuralChatbot)

# Neural Chatbot

This is a chatbot that can run in the browser and that uses tensorflowjs sentence embeddings.  It is based on the npm modules 'neural-phrasex' and 'neural-sentence-search'.  It really only needs one example per intent (one shot learning) since the sentence embeddings contain
the overall meaning of that example.  Ultimately, this will allow one shot re-enforcement learning in this client side bot.  Since all the sentence embedding calcuations are done using mobile tensorflow, there is no need to set up a server and the chatbot can be embedded into a web frontend without external calls.  I'm working on
a demo of that capability.

This code is in transition.  Moving from elastic search based to client side with sentence embeddings.  Also moving from older style Node.js to more modern.  This will also undergo simplification time permitting and updated documentation.

# Installation:

```bash
npm install neural-chatbot
```

# Testing

```bash
npm test
```

# Implementing Your Own Bot!
The simplest bot one can create is the "BasicBot" which only attaches to a phrase database.  The questions the bot can respond to
are entirely defined from the phrase database.  There first step is to create a phrase database, an
example phrase database is given below.  This database is stored in a file and expanded, inserted into mongodb and then indexed in elasticsearch.  First make sure one and only one copy of elasticsearch is running, first try and kill it

Create a phrase database file, here is an example

```javascript
let db = {
    "data": [
    {
        "phrase": ["What do you do for a living",
                        "What is your job", "How do you make money"],
        "response" : ["I'm an engineer", "sometimes I work as a cook"],
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
    "response" : ["Aliens"],
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
    "phrase": ["You are smart","You look nice","you are good",
                        "DAMN","this is great","this is awesome","this is fantastic",
                        "this rules"],
    "response": ["thanks","I know","duhh"],
    "phraseType": "compliment",
    "implies": [
        "compliment"
    ],
    "target": [
    ],
    "meta": {
        "style": [
            "nosearch"
        ],
        "group": "compliment"
    }
    },
    {
    "phrase": ["do you have family?","do you have any kids","do you have any children"],
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
    }]
}
```
Now you can use that phrase database
```javascript
let { BasicBot } = require('neural-chatbot');
let { UserData } = require('neural-phrasex')

let conf = {
    database: db,
    doc: {
    description: {
        name: "jimmy",
    },
    },
}
let bot = new BasicBot()
await bot.initialize(conf)

let userData = new UserData();
userData.initialize()

let ans = await bot.getResult(phrase, userData)

console.log('ans', ans)

```

# How does the phrase database work?

Here is a typical entry into the phrase database

```javascript
{
    "phrase": [
        "Which (column) is (item) in"
    ],
    "response": [
        "(item) is in (column) (value)"
    ],
    "negative": [
        "There is no (item)"
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
            "indefinite",
                "singular"
            ],
        "group": "location"
    }
}
```

The first element of the entry is, "phrase" which is simply the phrase
that will be searched for in elasticsearch.  Wildcard terms are given
in parentheses, so (column) and (item) are wildcards.  When the phrase
database file is processed a list of words is created that are not wildcards and
used in the search engine.  In the example the list would be ["which","is","in"],
these words are used for the initial bag of words search using elasticsearch.

The "response" element returns the response to the given phrase.  The response
can contain additional wildcards - how these wildcards are filled up depends
on the 'Action' defined for the particular group inside clockmaker.  By default,
the wildcards given in "phrase" will be copied into the values given in "response",
therefore, a phrase : "My name is (name)" with response "Hello (name)" will become
"My name is John" with (name)=John and "Hello John".  The exact action that is
performed on a given phrase class is defined in "source/boteng" . An example of
an action is the "NoSearchAction", which simply takes the phrase wildcards and
places them in response wildcards (if any exist).

```javascript
"use strict"

let Action = require('../boteng/Action.js')
let Formatting = require('../boteng/Formatting.js')
let Logger = require('helper-clockmaker').Logger('NoSearchAction')
let { Helper } = require('helper-clockmaker')

class NoSearchAction extends Action {

    constructor() {
        super();
        this.name = 'NoSearchAction'
    }

    /**
     * Filter takes an input and returns true
     * or false as to whether the filter passes.
     */
    filterInput(input) {
        Helper.hasProperties(input, ['typeIdentifier'])
        return input.typeIdentifier.match(/nosearch/i)
    }

    /**
     * Compute the input given this filter
     */
    computeResult(input, userData) {
    
        let replies = input.replies;
        let wildcards = input.wildcards;
    
        let replyTemplate = Helper.selectRandom(replies);
    
        return Promise.resolve(Formatting.none({
            replyTemplate : replyTemplate, 
            wildcards : wildcards, 
            confidence : input.confidence
        }, userData))
    }
}

module.exports = NoSearchAction;
```

In this case the filterInput returns true if typeIdentifier contains the
text "nosearch".  typeIdentifier is a serialization of the "meta" element as
well as the phrase type.  Other examples can be found in the boteng directory.

The "implies" element is what is typically referred to as and "intent" in most
conversational agent codes.  It describes the intent of a question, for example
the phrase "where is washington" implies "place", this bit of data can then be
used search for "place" in a database describing Washington.

The "target" : ["item"] element lets the Action know that we are interested in
the "place" of the wildcard "item".  For many problems, target is not required
and even implies is not needed, however they are generally used when a database
search is performed as a result of the Action.

# Defining your own Actions
Actions can be defined outside of the clockmaker framework and integrated in simply
by creating new actions and referencing them in the bot constructor.

    let BasicBot = require('../response/PhrasexBotLib.js').BasicBot;
    obj = {
        files : ["someDirectory/someFile.js","otherDirectory/otherFile.js"]
    }
    let bot = new BasicBot(obj);

The "obj" above defines the files containing the Actions the user wants to use.  Setting
actions in the constructor overwrites the default Action list.  Also, actions are evaluated
sequentially and the result is computed for the first action that return true, as such your
default action should always be the last file in the list.  The user defined "Action" class
does not need to be derived from "Action", but does need to contain the two functions "filterInput"
and "computeResult".  That's all there is to it, now you can define your own actions.