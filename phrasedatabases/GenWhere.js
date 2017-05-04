"use strict"

let jsonFile = require('jsonfile')
let prepositions = require('prepositions')
let clone = require('clone')

let data = [];

//only use a few until I figure out how to deal with all of them
prepositions = ["in","on","at","under"]

for (let i = 0; i < prepositions.length; i++) {

    let p = prepositions[i];

    let val = "(item):" + p

    //---------------Where is------------------------
    let obj = {
        "phrase": [
            "Where is (item)"
        ],
        "response": [
            "(item) is " + p + " (value)"
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
                }
            },
            "response": {
                "set": {
                }
            }
        },
        "meta": {
            "style": [
                "indefinite",
                "2wc"
            ],
            "group": p
        }
    }

    obj.storage.phrase.get[val]="(value)"
    obj.storage.response.set[val]="(value)"

    data.push(clone(obj));

    obj = {
        "phrase": [
            "Where is (item)"
        ],
        "response": [
            "(item) is " + p + " the (value)"
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
                }
            },
            "response": {
                "set": {
                }
            }
        },
        "meta": {
            "style": [
                "semi-indefinite",
                "2wc"
            ],
            "group": p
        }
    }

    obj.storage.phrase.get[val]="(value)"
    obj.storage.response.set[val]="(value)"

    data.push(clone(obj))

    obj = {
        "phrase": [
            "Where is the (item)"
        ],
        "response": [
            "The (item) is " + p + " the (value)"
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
                }
            },
            "response": {
                "set": {
                }
            }
        },
        "meta": {
            "style": [
                "definite",
                "2wc"
            ],
            "group": p
        }
    }

    obj.storage.phrase.get[val]="(value)"
    obj.storage.response.set[val]="(value)"

    data.push(clone(obj));

    //----------------Where are--------------------------
    obj = {
        "phrase": [
            "Where are (item)"
        ],
        "response": [
            "(item) are " + p + " (value)"
        ],
        "negative": [
            "There are no (item)",
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
                }
            },
            "response": {
                "set": {
                }
            }
        },
        "meta": {
            "style": [
                "pluaral",
                "indefinite",
                "2wc"
            ],
            "group": p
        }
    }

    obj.storage.phrase.get[val]="(value)"
    obj.storage.response.set[val]="(value)"

    data.push(clone(obj));

    obj = {
        "phrase": [
            "Where are (item)"
        ],
        "response": [
            "(item) are " + p + " the (value)"
        ],
        "negative": [
            "There are no (item)",
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
                }
            },
            "response": {
                "set": {
                }
            }
        },
        "meta": {
            "style": [
                "singular",
                "semi-indefinite",
                "2wc"
            ],
            "group": p
        }
    }

    obj.storage.phrase.get[val]="(value)"
    obj.storage.response.set[val]="(value)"

    data.push(clone(obj))

    obj = {
        "phrase": [
            "Where are the (item)"
        ],
        "response": [
            "The (item) are " + p + " the (value)"
        ],
        "negative": [
            "There are no (item)",
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
                }
            },
            "response": {
                "set": {
                }
            }
        },
        "meta": {
            "style": [
                "singular",
                "definite",
                "2wc"
            ],
            "group": p
        }
    }

    obj.storage.phrase.get[val]="(value)"
    obj.storage.response.set[val]="(value)"


    data.push(clone(obj))

}

jsonFile.writeFile("WherePrep.json", {data: data}, {spaces: 2},function (err) {
  console.error(err)
})
