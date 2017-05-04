#!/bin/bash
#The first argument is the name of the index to print.

echo $1
first='http://localhost:9200/'$1'/_search?&size=10000&pretty=true&q=*:*'
echo $first

curl -XGET $first
