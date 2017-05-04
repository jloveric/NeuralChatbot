#!/bin/bash

curl -XPUT 'http://localhost:9200/_template/standard_template' -d '{
  "template": "*", 
  "settings": {
    "number_of_shards": 1 
  },
  "mappings": {
    "doc": {
      "properties": {
        "text": {
          "type": "string",
          "norms": { "enabled": false } 
        }
      }
    }
  }
}'