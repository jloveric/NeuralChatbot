"use strict"

let Action = require('sb/boteng/Action.js')
let Formatting = require('sb/boteng/Formatting.js')
let Logger = require('sb/etc/Logger.js')('IdentityAction')
let Helper = require('sb/etc/Helper.js')
let formatHelp = require('sb/etc/FormatHelp.js')
let slotFiller = require('sb/phrasex/SlotFiller.js')

class IdentityAction extends Action {
    constructor() {
        super();
        this.name = 'IdentityAction'
    }

    /**
     * Filter takes an input and returns true
     * or false as to whether the filter passes.
     */
    filterInput(input) {
        Helper.hasProperties(input, ['source'])
        if (input.source.meta) {
            return Helper.matchesRegex(input.source.meta.group, "identity")
        }
        return false
    }

    /**
     * Compute the input given this filter
     */
    computeResult(input, userData) {
        Helper.hasProperties(input, ['replies', 'doc'])
        let replies = input.replies;
        let wildcards = input.wildcards;
        let replyTemplate = Helper.selectRandom(replies);
        let ans = slotFiller.reconstructPhrase(replyTemplate.phrase, { value: input.doc.description.name }).phrase
        return Promise.resolve({ response: ans, wildcards: [wildcards], phrase: replyTemplate, confidence : input.confidence, success : true, slotScore : 0})
    }
}

module.exports = IdentityAction;