"use strict";

let Logger = require('sb/etc/Logger.js')('CreateDatabaseConfig');
let CreateMappingConfig = require('sb/etc/CreateMappingConfig.js');
let fs = require('fs');
let MongoFilesystem = require('sb/extdb/MongoFilesystem.js');
let NLP = require('natural')
let Helper = require('sb/etc/Helper.js')
let deepcopy = require('clone')
let debug = require('debug')('CreateDatabaseConfig')

/**
 * Create a configuration for the database which consists of
 * the queries that can be asked of the database and the mapping
 * of column names to entity type.
 */
class CreateDatabaseConfig {
    constructor() {
        Logger.debug('Dumping CreateDatabaseConfig')
        this.mappingConfig = new CreateMappingConfig();
        this.queryConfig = [];
        this.indexName;
        this.MongoFilesystem = new MongoFilesystem();
        this.keywords = {}
        
        //synonym mapping
        this.syn = new Map()

        this.wordnet = new NLP.WordNet()
    }

    close() {
        this.MongoFilesystem.close();
    }

    addSynonyms(word) {
        if(!word) {return Promise.resolve()}
        let np = new Promise((resolve, reject) => {

            this.wordnet.lookup(word, (results) => {

                results.forEach((result) => {
                    let syn = result.synonyms;
                    for (let i of syn) {
                        let res = this.syn.get(i)
                        if (res) {
                            if (res != word) {
                                Logger.warn('Synonyms already has entry for', i, res, 'replacing with', word)
                            }

                        }

                        this.syn.set(i, word)
                    }

                });
                //console.log('---------------------------')
                //console.log(this.syn)
                resolve();
            });
        });

        return np;
    }
    
    /**
     * Initialize takes an object with the following elements
     * 
     * @param primary is the primary key for search
     * @param columns is the actual column name in the database
     * @param mapping is the name set by the storebot user.  These names are general
     * person, place, thing and are less specific than the keyword for the same aisle.
     * @param queries are the valid query types for this database
     * @param keywords is an object for a single keyword for each row.  These
     * keywords basically translate the row name, 'aisleid' or 'first_name' to something a user
     * would actually say (or type) like 'aisle' or 'first name'
     * @param indexName is the name of the index in elasticsearch
     * @param filesystem is the name of the mongodb database used as the filesystem
     */
    initialize(obj) {
        debug('Initializing CreateDatabaseConfig with', obj)
        this.config = deepcopy(obj)

        Helper.logAndThrowUndefined('Must define primary', this.config.primary, true)
        this.primary = this.config.primary;

        //obj.columns, mapping, queries, keywords, indexName, filesystem)
        debug('Before array check')
        if(Array.isArray(obj.keywords)) {
            Helper.logAndThrow('CreateDatabaseConfig keywords is an Array and should be an object')
        }
        
        debug('Before filesystem')
        if (!obj.filesystem) {
            Logger.warn('CreateDatabaseConfig: Filesystem not defined')
        }
        
        //this.keywords = obj.keywords;
        debug('config is', this.config)
        let np = this.MongoFilesystem.initialize(this.config.filesystem)
        let pList = [np]
        Logger.debug('object',this.config)
            
        for (let i = 0; i < this.config.mapping.length; i++) {
            if (this.config.mapping[i] != 'none') {
                this.mappingConfig.addMapping(this.config.columns[i], this.config.mapping[i]);
                
                //Also, add synonyms
                pList.push(this.addSynonyms(this.config.keywords[this.config.columns[i]]))

            }
        }

        //this.indexName = obj.indexName;
        debug('Final promise before exit initialize')
        let pFinal = new Promise((resolve, reject) => {
            Promise.all(pList).then( () => {
                resolve();
                //console.log('Resolved all!', this.getConfigObject())
            }).catch((reason)=>{
                Logger.error('CreateDatabaseConfig initialize failed for reason', reason)
                reject(reason)
            })
        })

        return pFinal;
    }

	/**
	 * Validate all components
	 */
    validate() {
        this.mappingConfig.validate();
        //this.queryConfig.validate();
        if (!this.config.indexName) {
            Logger.error('Database index name is undefined in configuration.');
        }
    }

	/**
	 * Combine components and write to a file
	 */
    writeToFile(filename) {

        let tobj = this.getConfigObject();

        let newString = JSON.stringify(tobj, null, 2);

        Logger.info('Creating configuration shown', newString);

        let np = new Promise((resolve, reject) => {
            fs.writeFile(filename, newString, 'utf8', function (err) {
                if (err) {
                    Logger.error('Database config write error:', err);
                }
                resolve(true);
            });
        });

        return np;
    }

    writeToMongo(filename, user) {
        Logger.debug('Inside writeToMongo', filename, user)
        let tobj = this.getConfigObject();

        let newString = JSON.stringify(tobj, null, 2);

        let np = this.MongoFilesystem.replaceTextInMongo(
            newString, filename, user, "databaseConfig");

        return np;
    }

    getConfigObject() {
        let tobj = {
            databaseNameMapping: this.mappingConfig.getMapping(),
            indexName: this.config.indexName,
            synonyms : [...this.syn],
            keywords : this.config.keywords,
            primary : this.primary,
        }

        return tobj;
    }
}

module.exports = CreateDatabaseConfig;