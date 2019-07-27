"use strict";
let CreateLogstashConfig = require("sb/extdb/CreateLogstashConfig");

describe("CreateLogstashConfig", function() {
  it("Should make a config file", function() {
    let cl = new CreateLogstashConfig();

    let lsConfig = {
      csvFilename: "file.csv",
      fields: ["name", "location", "size", "cost"],
      separator: ",",
      useStdIn: false,
      fileDatabase: "fileSystemTest",
      user: "john.loverich@gmail.com"
    };

    //cl.initialize('file.csv', ["name", "location", "size", "cost"], ",",false,"fileSystemTest");
    cl.initialize(lsConfig);
    cl.writeToFile("file.csv.logstash");
    let res = cl.getConfig();

    console.log(res);
  });

  it("Should make a config mongodb file", function(done) {
    let cl = new CreateLogstashConfig();

    let lsConfig = {
      csvFilename: "file.csv",
      fields: ["name", "location", "size", "cost"],
      separator: ",",
      useStdIn: true,
      fileDatabase: "fileSystemTest",
      user: "john.loverich@gmail.com"
    };

    let np = cl.initialize(lsConfig);
    np.then(() => {
      cl.writeToMongo("file.csv.logstash", "john.loverich@gmail.com").then(
        () => {
          done();
        }
      );
    });

    let res = cl.getConfig();

    console.log(res);
  });
});
