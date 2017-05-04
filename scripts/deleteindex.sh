#!/bin/bash
#The first argument is the name of the index to print.
#Counts the number of documents in the database.

echo $1
first='http://localhost:9200/'$1'/'
echo $first

curl -XDELETE $first
echo
