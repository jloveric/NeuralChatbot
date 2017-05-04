"use strict";

let Base = require('sb/etc/Base.js')
let Logger = require('sb/etc/Logger.js')('Helper')
let SbEvent = require('sb/etc/SbEvent.js');
let StopWords = require('sb/etc/Stopwords.js');
let BinarySearch = require("binary-search");
let debug = require('debug')('helper')

module.exports = {

    //A bunch of objects to help with indexing through logstash
    indexingNoForceNoWait: { forceIndex: false, returnFast: true },
    indexingNoForceWait: { forceIndex: false, returnFast: false },
    indexingForceNoWait: { forceIndex: true, returnFast: true },
    indexingForceWait: { forceIndex: true, returnFast: false },

    /**
     * Return the directory given a path.
     */
    getDirectory(path) {
        return path.substring(0, Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")));
    },

    /**
     * Expand abbreviations into complete words
     * @param word is the word that may be an abbreviations
     * @param abbreviation is the map (r to are) of abbreviations
     * @return the expanded word if it needs to be expanded.
     */
    expandWord(word, abbreviations) {
        let ans = abbreviations.get(word);
        if (ans) return ans;
        return word;
    },

    /**
     * The sentence is broken into a bunch of words which are then
     * processed word by word.
     */
    expandSentence(wordArray, abbreviations) {
        for (let i = 0; i < wordArray.length; i++) {
            wordArray[i] = this.expandWord(wordArray[i], abbreviations)
        }

        return wordArray;
    },

    betweenParentheses: /\(([^)]+)\)/,
    betweenBrackets: /\[([^)]+)\]/,
    lineBreak: /\n/g,
    tokenize: /\S+/g,
    nonAlphaNumeric: /\W/g,
    betweenEm: /<em>(.+?)<\/em>/g,

    //Notice not parenthesis() are included since those are used
    //as wildcards (item)
    punctuation: /[.,\/#!$%\^&\*;:{}=\-_`~?]/g,



    //convert elements to lowercase and elliminate punctuation
    cleanArray(a) {
        for (let i = 0; i < a.length; i++) {
            a[i] = a[i].replace(this.punctuation, "").toLowerCase();
        }
        return a;
    },

    //This is the id added to database files so we can
    //re-index in elasticsearch without doubling up documents, i.e.
    //we can overwrite documents easily.
    extraId: 'appendID',

    defaultResponse: ["I'm not sure what you're asking.", "Please clarify.",
        "I'm not understanding.", "I'm only a bot, clarify."],

    //Return the fields that were highlighted by elasticsearch.    
    highlightedFields(highlight) {
        debug('highlight', highlight)
        let hFields = []
        for (let i in highlight) {

            if (i != 'message') {
                hFields.push(i)
            }
        }
        return hFields;
    },

    /**
     * This is meant to be used with the elasticsearch highlighter
     * and it extracts some information that can be used to
     * improve scoring.  
     **/
    matchedHighlightWords(highlightField) {
        //let matchCount = ((highlightField.match(/<em>/g) || []).length);
        let total = highlightField.match(this.tokenize)
        let val = highlightField.match(this.betweenEm);
        for (let i = 0; i < val.length; i++) {
            val[i] = val[i].replace(/<\/?em>/g, '');
        }
        return { matchWords: val, matchCount: val.length, totalCount: total.length, score: (val.length / total.length) }
    },

    //TODO: get rid of this and replace with highlightedFields
    //plus an extra call to get the actual field value
    returnHighlightField(highlight) {
        for (let i in highlight) {
            if (highlight[i] != "message") {
                //console.log('highligh[i]',highlight[i])
                return highlight[i][0].replace(/<\/?em>/g, '');
            }
        }
        return null;
    },

    closeIfExists: function (object, name) {
        object ? object.close() : Logger.error('Could not close', name, 'since it is undefined')
    },

    logAndThrowUndefined: function (error, val, dontKill) {
        if (!val && (val != 0)) {
            Logger.error(error);
            debug('error', error)
            if (!dontKill) {
                SbEvent.emit('error', error);
                SbEvent.emit('close')
            }
            return true;
        }
        return false;
    },

    logAndThrow: function (error, dontKill) {
        Logger.error(error);
        debug('error', error)
        if (!dontKill) {
            SbEvent.emit('error', error);
            SbEvent.emit('close')
        }
        return true;
    },

    findProperty(obj, property) {
        let a = [];

        if (obj[property]) {
            a.push(property)
        } else {
            for (let i in obj) {

                if (!Array.isArray(obj[i]) && (typeof (obj[i]) === 'object')) {

                    let b = this.findProperty(obj[i], property)
                    if (b.length > 0) {
                        a.push(i)
                        a = a.concat(b)
                        return a;
                    }
                }
            }
        }
        return a;
    },

    /**
     * Tell whether array of text contains the regex or
     * not.
     * @param a is the array of text
     * @param regex is the regex
     */
    containsRegex(a, regex) {
        if (!a) return false;

        for (let i = 0; i < a.length; i++) {
            if (this.matchesRegex(a[i], regex)) {
                return true;
            }
        }
        return false;
    },

    hasValue(a, val) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] == val) {
                return true;
            }
        }
        return false;
    },

    matchesRegex(a, regex) {
        if (!a) return false;

        if (a.search(regex) > -1) {
            return true;
        }
        return false;
    },

    /**
     * The elasticsearch index name is used in more than
     * one spot so this is just to make sure that the name
     * is computed consistently in the different locations.
     * Note that different users may use the same file so the
     * database name in elasticsearch needs to be differentiated
     * differently.
     * 
     * @param filename is the base name of the file
     * @param username is the account/user name
     */
    uniqueIndexName: function (filename, username) {
        let expand = filename + '.' + username;

        //cut out the leading directory and only leave the
        //filename
        let shortName = expand.replace(/^.*[\\\/]/, '');
        Logger.info('Using filename', shortName)
        return shortName.toLowerCase();
    },

    uniquePhraseIndexName: function (filename, username) {
        return this.uniqueIndexName(filename + '.phrase', username)
    },

    hasProperties: function (obj, properties, dontKill) {
        let found = true;
        for (let i of properties) {
            if (typeof obj[i] === 'undefined') {
                Logger.error('Property', i, 'is undefined')
                if (!dontKill) {
                    SbEvent.emit('error')
                }
                found = false;
            }
        }
        return found;
    },

    timeAndDate: function () {
        let d = new Date();
        let thisTime = d.getHours() + ":" + d.getMinutes() + " " + d.getMonth() + "/" + d.getDate() + "/" + d.getFullYear();
        return thisTime;
    },

    isUsingNode: function () {
        return Base.isUsingNode()
    },

    selectRandom(strArray) {
        let id = Math.floor(Math.random() * strArray.length);
        return strArray[id];
    },

    fileExtension: function (filename) {
        return filename.split('.').pop();
    },

    /**
     * I need a standard place to store these values since they are used in various places, but shouldn't be in the
     * base class.  This will do for now.
     */
    recordValues: {
        tableName: "qa",
        fieldNames: ["Question", "Answer", "Status", "Responder",
            "Qid", "Time", "Type", "Userid", "Replied"],
        fieldTypes: ["text", "text", "text", "text",
            "text", "text", "text", "text", "text"]
    },

    validMappingElements: ["none", "item", "place", "price",
        "property", "definition", "quality",
        "person", "person2"],

    /**
     * TODO: These are taken from BotInformationForm.js and generally should match 
     * as those change in the form.
     */
    botDatabaseFields: ["name", "nickname", "purpose", "keywords",
        "business", "city", "state", "county", "country"],

    botDatabaseMapping: ["person", "property", "property", "property",
        "place", "place", "place", "place", "place"],

    botDatabaseKeyword: {
        name: "name", nickname: "nickname", purpose: "purpose", keywords: "keywords",
        business: "business", city: "city", state: "state", county: "county", country: "country"
    },

    failScore: { score: 0, order: 0, size: 0 },

    noResponse : {noResponse : true, confidence : 1.0, success : true},

    failResponse: { response: "", success: false, confidence: 0.0, score: { score: 0, order: 0, size: 0 } },

    moreResponse: "click here or type 'more' to see more results.",

    isFailResponse(res) {
        return (res.response == "") && (res.success == false);
    },

    stopWordIndex(word) {
        let id = BinarySearch(StopWords, word, function (a, b) {
            if (a == b) return 0;
            if (a > b) return 1;
            return -1;
        })

        return id
    },

    isStopWord(word) {
        let id = this.stopWordIndex(word)
        if (id < 0) return false;
        return true;
    },

    /**
     * Set or create an object element 
     * as an array of property names.  So if array=[a,b,c,d] then this
     * function return obj.a.b.c.d
     * 
     * @param obj is an object
     * @param array is the element defined
     * as [a,b,c,d]
     * @param value is the value to set the element to
     */
    setCreateElementArray(obj, array, value) {
        let ans = obj;
        for (let j = 0; j < array.length; j++) {

            let i = array[j];
            console.log('i',i,'value',value)
            if (j == (array.length - 1)) {
                ans[i] = value;
                break;
            }

            if (ans[i] != null) {
                ans = ans[i]
            } else {
                ans[i] = {};
                ans = ans[i];
            }
        }

        ans = value;
        return ans;
    },

    /**
     * Return the element of an object passed in 
     * as an array of property names.  So if array=[a,b,c,d] then this
     * function return obj.a.b.c.d
     * 
     * @param obj is an object
     * @param array is the element defined
     * as [a,b,c,d]
     */
    getObjElementArray(obj, array) {
        //if(!array) return null;
        
        let ans = obj;
        for (let i of array) {
            if (ans[i] != null) {
                ans = ans[i]
            } else {
                return null;
            }
        }
        return ans;
    },

    /**
     * Return the element of an object passed in 
     * as text.  So if text='a.b.c.d' then this
     * function return obj.a.b.c.d
     * 
     * @param obj is an object
     * @param text is the element defined as text such
     * as 'a.b.c.d'
     */
    getObjElement(obj, text) {
        let a = text.split('.')
        let ans = obj;
        for (let i of a) {
            ans = ans[i]
        }
        return ans;
    },

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },

    getLastElement(text) {
        let a = text.split('.')
        return a[a.length - 1];
    },

    getLeadingElements(text) {
        let ans = [];
        let a = text.split('.')
        for (let i = 0; i < a.length - 1; i++) {
            ans.push(a[i]);
        }

        if (ans.length == 0) {
            return '';
        }

        return ans.join('.')
    },

    computeElement(leading, lastElement) {
        if (!lastElement) {
            return '';
        }

        if (!leading) {
            return lastElement;
        }
        return leading + '.' + lastElement;
    },

    /**
     * Return the object in an array of objects with
     * the best value.
     * @param tArray is the array of objects
     * @param comparison is a function that compares
     * objects of the form compare(currentBest, tArray[i])
     * this function should return true if tArray is better
     * than currentBest, and false if it is not better.
     */
    objectWithBestValue(tArray, comparison) {
        let best = tArray[0];
        for (let i = 1; i < tArray.length; i++) {
            if (comparison(best, tArray[i])) {
                best = tArray[i];
            }
        }
        return best;
    },

    /**
     * Given an array of hits construct a new array
     * which only return the top hits.
     * @param hits is an array of elasticsearch hits.
    */
    topScores(hits) {

        if (hits.length == 0) return []

        let rSet = []
        let maxScore = hits[0]._score;

        for (let i = 0; i < hits.length; i++) {
            if (hits[i]._score >= maxScore) {
                rSet.push(hits[i])
            }
        }

        return rSet;
    },

    isObject(val) {
        if (val !== null && typeof val === 'object') {
            return true;
        }
        return false;
    },

    combineSimilarity(a,b) {
        let c = {}
        c.exact = a.exact+b.exact;
        c.score = a.score+b.score;

        //Not sure if this is the right way to add orders
        c.order = 0.5*(a.order+b.order);
        
        c.size = 1.0/((1.0/a.size)+(1.0/b.size))
        return c;
    },

    /**
     * The type is a combination of the imply plus the style of writing, past, present
     * indefinite etc..
     * @param source is the document from the database
     */
	/*getTypeIdentifier(source) {
		let tClass = source.implies.join(',')
		if (source.meta.style) {
			tClass = tClass + ',' + source.meta.style.join(',')
		}

		if (source.meta.group) {
			tClass = tClass + ',' + source.meta.group
		}
		return tClass;
	}*/

    getTypeIdentifier(source) {
        if (!source) return ''

        let tClass = ''
        if (source.implies) {
            tClass = source.implies.join(',')
        }

        if (source.meta) {
            if (source.meta.style) {
                tClass = tClass + ',' + source.meta.style.join(',')
            }

            if (source.meta.group) {
                tClass = tClass + ',' + source.meta.group
            }
        }
        return tClass;
    }

};
