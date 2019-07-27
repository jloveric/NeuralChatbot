"use strict";

describe("Logger", function() {
  it("Should Test the Logger", function() {
    let Logger = require("sb/etc/Logger.js")("LoggerSpec");
    Logger.error("Testing the Logger");

    //Logger = require('sb/etc/Logger.js')();
    //Logger.error('Testing the Logger')
  });
});
