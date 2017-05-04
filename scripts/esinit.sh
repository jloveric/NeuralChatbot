#!/bin/bash

#Keep waiting until the server can be reached
until $(curl --output /dev/null --silent --head --fail http://localhost:9200); do
    printf '.'
    sleep 5
done

#shouldn't need this, but I have it!'
sleep 5

#set the default template
curl -XPUT 'http://localhost:9200/_template/template1' -d '{
	"template": "*",
	"settings": {
		"number_of_replicas": "1",
		"number_of_shards": "1",
		"index": {
			"similarity": {
				"default": {
					"type": "BM25",
					"b": "0.0",
					"k1": "1.2"
				},
				"norm_bm25": {
					"type": "BM25",
					"b": "0.75",
					"k1": "1.2"
				}
			}
		}
	}
}'

