"use strict"

let Action = require('sb/boteng/Action.js')
let Formatting = require('sb/boteng/Formatting.js')
let Logger = require('sb/etc/Logger.js')('NoSearchAction')
let Helper = require('sb/etc/Helper.js')


/**
 * This action returns true for every phrase so should
 * not be included in the botEngine list.  Instead it is
 * used independtly to just check the result when the
 * data is filled with known wildcards.
 */
class FromStorageAction extends Action {
    
    constructor() {
        super();
        this.name = 'FromStorageAction'
    }

    /**
     * Filter takes an input and returns true
     * or false as to whether the filter passes.
     */
    filterInput(input) {
        return true
    }

    /**
     * Compute the input given this filter
     */
    computeResult(input, userData) {
        
        let replies = input.replies;
        let wildcards = input.wildcards;
        
        if(!replies) {
            return Promise.resolve(
                {confidence : 0, success : false})
        }

        let replyTemplate = Helper.selectRandom(replies);
        
        return Promise.resolve(Formatting.fromStorage({
            replyTemplate : replyTemplate, 
            wildcards : wildcards, 
            confidence : input.confidence
        }, userData))
    }
}

module.exports = FromStorageAction;