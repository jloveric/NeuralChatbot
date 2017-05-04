"use strict";

let Base = require('./Base.js');
let logger;


module.exports = function (moduleName) {


    //Currently Winston does not work on the browser so we need this.
    if (Base.isUsingNode()) {
        //require('events').EventEmitter.prototype._maxListeners = 100;
        process.setMaxListeners(0)
        let GetConfigValues = require('sb/etc/GetConfigValues.js')

        let gc = new GetConfigValues();

        //if(false) {
        let winston = require('winston')

        let thisFilename = process.cwd() + '/' + gc.logging.file;

        logger = new (winston.Logger)({
            transports: [
                new (winston.transports.File)({
                    filename: thisFilename,
                    json: false,
                    colorize: true,
                    level: gc.logging.level,
                    prettyPrint: true,
                    timestamp: false,
                    handleExceptions: true,
                    label: moduleName
                })
            ]
        });



        //Turn on logging to the file
        /*winston.add(winston.transports.File,
            {
                filename: thisFilename, json: false, colorize: true,
                level: gc.logging.level, prettyPrint: true, timestamp: false,
                handleExceptions: true,
                label : moduleName
            })
    
        console.log('logging', gc.logging.level)
    
        //Don't log to the console
        winston.remove(winston.transports.Console);
    
        //logger.handleExceptions(new logger.transports.File({ filename: thisFilename }));
        winston.handleExceptions(new winston.transports.Console());*/
    } else {
        logger = require('./BrowserLogger.js');
    }

    return logger

}

//module.exports = logger;