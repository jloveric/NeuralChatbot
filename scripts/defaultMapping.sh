#!/bin/bash
#The first argument is the name of the index to print.
#Counts the number of documents in the database.

#echo $1
#first='http://localhost:9200/'$1'/_stats'
#echo $first

#curl -XGET $first
#echo

echo "adding a default template"

curl -XPUT 'http://localhost:9200/_template/template_1' -d '{
  "template": "*",
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  },
  "mappings": {
    "_default_": {
      "dynamic_templates" : [{
        "string_fields" : {
          "match" : "*",
          "match_mapping_type" : "string",
          "mapping" : {"type":"string","index_options":"docs"}
        }  
      }]
  }
}'
