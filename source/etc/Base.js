"use strict";

/**
 * I needed this as some things require the Logger, and unfortunately,
 * the Logger requires this.  Soooo...
 */
module.exports = {
	 /**
     * Find out if you are using node or the browser.  This approach should work
     * for both nwjs and node and the browser.
     */
    isUsingNode: function () {
        let usingNode = false;
        if (typeof process === 'object') {
            if (typeof process.versions === 'object') {
                if (typeof process.versions.node !== 'undefined') {
                    usingNode = true;
                }
            }
        }

        return usingNode;
    }
}