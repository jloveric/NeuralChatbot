#!/bin/bash

tdir=$(pwd)

#script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR
cd ../dependencies

echo "copying elasticsearch.yml to config directory"
cp es.yml elasticsearch/config/elasticsearch.yml

echo "starting up elasticsearch"
elasticsearch/bin/elasticsearch&

esjob=$!

cd $DIR
./esinit.sh