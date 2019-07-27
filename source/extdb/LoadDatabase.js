"use strict";

let CreateLogstashConfig = require("./CreateLogstashConfig.js");
let ProcessDatabase = require("./ProcessDatabase.js");
let StartupDBSearch = require("./StartupDBSearch.js");

/**
 * TODO: It seems this isn't actually used anywhere.
 */
class LoadDatabase {
  constructor() {}

  close() {
    this.CreateLogstashConfig.close();
    this.ProcessDatabase.close();
    this.StartupDBSearch.close();
  }

  /**
   * Make the database accesible to elasticsearch.
   */
  initialize(filename) {
    this.CreateLogstashConfig = new CreateLogstashConfig();
    this.ProcessDatabase = new ProcessDatabase();
    this.StartupDBSearch = new StartupDBSearch();

    let np = this.ProcessDatabase.initialize(filename);

    np.then(data => {
      let columnNames = this.ProcessDatabase.getColumnNames();
      let configName = filename + ".logstash";

      this.CreateLogstashConfig(filename, configName, columnNames, ",");

      this.StartupDBSearch.initializeLogstash(configName);
    });
  }
}

module.exports = LoadDatabase;
