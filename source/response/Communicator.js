"use strict"

let debug = require('debug')('Communicator')
let Logger = require('sb/etc/Logger.js')('Communicator')

/**
 * The communicator determines where the data is sent, right now
 * there are only two options 'local' and 'browser'.  Actually, there
 * really only needs to be one options as the JSON.stringify
 * can be done in the client itself.  TODO: fix this!
 * 
 * Also, I'm not actually sure this belongs here.  Seems like it actually
 * belongs in StoreAi.  TODO: Move this file and the spec!
 */
class Communicator {

    constructor() {
        debug('Constructing Communicator')
    }

    initialize(answerQ, answerCallback, name) {
        debug('Initializing')
        this.answerQ = answerQ
        this.answerCallback = answerCallback
        this.name = name
    }

    setAnswerCallback(callback) {
        this.answerCallback = callback;
    }

    /**
     * Send the response from the database back to the user.
     */
    Respond(userId, client, answers) {
        debug('Stepping into Respond -- answers', answers)

        return this.answerCallback(answers).then(() => {

            let sendObj = answers;
            sendObj.botName = this.name;

            debug('answers', answers)

            switch (answers.clientType) {
                case 'local': //This is meant to fall through
                    if (client) {
                        client.send(sendObj);
                    } else {
                        Logger.warn('Client', userId, 'Does not exist')
                    }
                    break;
                case 'browser': {
                    if (client) {
                        debug('sendobj', sendObj)
                        client.send(JSON.stringify(sendObj));
                    } else {
                        Logger.warn('Client', userId, 'Does not exist')
                    }
                }
                    break;

                default:
            }

            return Promise.resolve();
        }).catch((reason) => {
            debug('error', reason)
            Logger.error(reason)
            return Promise.reject(reason);
        })

    }
}

module.exports = Communicator;