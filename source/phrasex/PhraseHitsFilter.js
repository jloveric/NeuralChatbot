"use strict";

let Helper = require("sb/etc/Helper.js");

/**
 * Base class for reducing the number of hits based on filters
 */
class PhraseHitsFilter {
  constructor() {}

  filter(hits) {}
}

class NoPhraseFilter extends PhraseHitsFilter {
  constructor() {
    super();
  }

  filter(hits) {
    return hits;
  }
}

class NoTellFilter extends PhraseHitsFilter {
  constructor() {
    super();
  }

  filter(hits) {
    let filteredHits = [];
    for (let i = 0; i < hits.length; i++) {
      let a = false;
      //console.log('HITS', i,hits[i])

      if (hits[i]._source.phraseType) {
        //console.log('HITS', hits[i].meta)
        a = Helper.matchesRegex(hits[i]._source.phraseType, "tell");
      }
      if (!a) {
        filteredHits.push(hits[i]);
      }
    }
    return filteredHits;
  }
}

/**
 * Hack for now, but 'kind' is causing problems...
 */
class FindStoreFilter extends PhraseHitsFilter {
  constructor() {
    super();
  }

  filter(hits) {
    let filteredHits = [];
    for (let i = 0; i < hits.length; i++) {
      let a = false;
      //console.log('HITS', i,hits[i])

      if (hits[i]._source.meta) {
        //console.log('HITS', hits[i].meta)
        a = Helper.matchesRegex(hits[i]._source.meta.group, "kind");
      }
      if (!a) {
        filteredHits.push(hits[i]);
      }
    }
    return filteredHits;
  }
}

let PhraseHitsFilterFactory = function(name) {
  switch (name) {
    case "FindStoreFilter":
      return new FindStoreFilter();
    case "NoPhraseFilter":
      return new NoPhraseFilter();
    case "NoTellFilter":
      return new NoTellFilter();
    default:
      Logger.error("Hits filter name", name, "not recognized");
  }
};

module.exports = PhraseHitsFilterFactory;
