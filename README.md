[![Build Status](https://travis-ci.org/jloveric/Clockmaker.svg?branch=master)](https://travis-ci.org/jloveric/Clockmaker)

# Installation:
Install node.js v4+ and mongodb.  Checkout the storebot repo.  Inside the storebot directory, run

    ./scripts/installall.sh

Next, start elasticsearch

    ./scripts/elasticsearch.sh

Now you can install the test databases by running the script (this will take a few minutes)

    ./scripts/installStoreAiTests.sh

# Testing

To test the nodejs components type

    npm test

To test a specific test file run 

    jasmine spec/{testname}.js 

If this doesn't run, likely jasmine needs
to be installed.  Install jasmine globally 

    npm install -g jasmine.

Coverage testing uses istanbul and can be run using

    npm run-script coverage

# Debugging with debug and logs

I use the module 'debug' instead of using console.log.  At the top of a file put

    let debug = require('debug')('{somename}')

Then set the environmental variable on the command line

    export DEBUG=somename,othername,another

debug can then be used just like console.log.  Then when you run the code this debug info will be printed to the command line, but only for the selected files.

In addition there are logs stored in storebot.log.  The logs are produced by the commands Logger.error(''), Logger.warn(''), Logger.debug('') inside StoreAi.  For debugging, debug is slightly nicer since it's color coded per file, however the logs are stored in files so are used in the deployed version of the code.

# Phrasex

The phrase database(s) are stored in the directory "phrasedatabase" and the important database there is PhraseDatabase.json.  As of this writing it contains information for generating 700+ phrases.  These phrases are processed and then indexed in elasticsearch.  When the user types something, elasticsearch is used to match the phrase with phrases in the database.  Many of the phrases contains wildcards (slots) that can be filled.  For example "where is the (item)" where (item) is a slot.  Phrasex not only determines the closest matching, but also fills in the slots.  So, if the user types "Where are the tacos" phrasex matches it with the phrase "Where are the (item)" and then creates a wildcard object where such as wc={item : tacos}. "Tacos" can then be used by elasticsearch to search the store database and return relevant entries.  You can experiment with phrasex by looking at the test spec/phrasex/PhrasexSpec.

# BasicBot
The most basic bot that uses phrasex is called BasicBot.  This bot can only respond with phrases described in PhraseDatabase.json, i.e. it does not query the store database for results.  One can experiment with this by looking at the test spec/response/BasicBotSpec.js

# PhrasexBot
PhrasexBot extends BasicBot so that one can also query a store database to generate answers.  The store database would be an rdbms with columns that might indicate item names, prices and locations (plus anything else).  One can experiment with this by looking at the test spec/response/PhrasexBotSpec.js . Using the PhrasexBotSpec one should be able to construct any interface for a single bot.

# Scoring
A critical component of phrase matching is scoring.  When searching for phrase matches, as a first cut we use elasticsearch and its simple scoring mechanism to return the first N best results.  The number of results returned can be set in config.json.  After narrowing the results with elasticsearch we use our own internal scoring mechanism.  Each phrase is assigned 4 different scores, exact - the number of exact word matches, score - the number of exact word matches plus a fractional score for each partial word match (food and good differ by one letter so the match score is less than 1.0), order - computes a score based on word order, size - computes a score based on the length of the matched phrase.

After returning the elasticsearch results the largest exact match score is computed.  After that all partial scores greater than or equal to the largest exact match score are saved, the rest discarded.  The remaing scores are multiplied by their respective order scores and length scores, from which the top score is taken as the best match.  This approach was reached through tons of experimentation, it was found that single scores (like those used in elasticsearch) were not nearly good enough to produce good matches in general.  Sentence similarity tests are used in the test spec/phrasex/SentenceSimilaritySpec.js in addition ReRanking of elasticsearch results is tested in spec/phrasex/ReRankSpec.js

# Implementing Your Own Bot!
The simplest bot one can create is the "BasicBot" which only attaches to a phrase database.  The questions the bot can respond to
are entirely defined from the phrase database.  There first step is to create a phrase database, an
example phrase database is given below.  This database is stored in a file and expanded, inserted into mongodb and then indexed in elasticsearch.  First make sure one and only one copy of elasticsearch is running, first try and kill it

    pkill -9 java

then, restart it

    ./scripts/elasticsearch

Also, create a phrase database file, here is an example

    {
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

Install the phrase database with the command 

    source/utils/initializePhraseDatabase.js --filename=examples/basic.json --indexname=uniqueindex

This is used to install a database into mongodb and elasticsearch.  Once the phrase database is created, it can be used by a bot.  A very basic bot is created below - a similar example can be found in spec/response/BasicBotSpec.js

    let BasicBot = require('sb/response/PhrasexBotLib.js').BasicBot;
    let UserData = require('sb/user/UserData.js')

    //fileDatabase should always be 'filesystem'
    //somebotname is your bots name - anything you want, but it can't match an existing bot
    //uniqueindex should be all LOWERCASE and is the name of the index in elasticsearch
    let conf = { 
      fileDatabase: 'filesystem', 
      doc : {
        description :
          {
            name : "somebotname"
          }
        },
        phraseTable : "uniqueindex" 
      }

    let userData = new UserData();
    userData.initialize()

    let bot = new BasicBot();
    bot.initialize(conf).then(() => {
      bot.getResult("What do you do for a living",userData).then((ans)=>{
        console.log(ans)
        bot.close()
        process.exit(0)
      }).catch((reason)=>{
        console.log('error',reason)
        bot.close();
        process.exit(0)
      })          
    }).catch((reason)=>{
      console.log('error',reason)		
    })

The bot and database described can be found in the "examples" directory of clockmaker.

# How does the phrase database work?

Here is a typical entry into the phrase database

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

    "use strict"

    let Action = require('sb/boteng/Action.js')
    let Formatting = require('sb/boteng/Formatting.js')
    let Logger = require('sb/etc/Logger.js')('NoSearchAction')
    let Helper = require('sb/etc/Helper.js')

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

    let BasicBot = require('sb/response/PhrasexBotLib.js').BasicBot;
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

# Understanding the code
The highest level class (or lowest) is in source/response/BasicBot.js or PhrasexBot.js which is derived
from BasicBot.js.  When trying to understand the code, it is best to start looking at BasicBot.js.
BasicBot contains a few critical pieces, namely the PhraseDatabase and a StorageObject 
(obtained from GenerateObject()) and a Phrasex object.  The phrase database is a reference to the mongo database
that contains the phrases the bot can respond to.  The Phrasex object on the other hand
refers to the indexed phrase database inside elasticsearch.  Phrasex itself matches the
users phrase with a phrase in the database, scores the results, figures out the wildcards.
The bot then takes this phrasex information and uses the BotEngine to compute the various
results.  The results are then reduced and a best result is calculated which is then passed
to the output along with scores.  Tests for the bots can be found in spec/response and spec/phrasex and
the tests in those directories can be used to understand the software.

The directory Extdb contains various method for dealing with databases, installing bots, creating configuration
files etc... but is generally not important to the structure of the bot code.

...