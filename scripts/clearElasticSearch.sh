#!/bin/bash

echo "Removing elasticsearch data directory"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
cd ..

rm -rf ./dependencies/elasticsearch/data