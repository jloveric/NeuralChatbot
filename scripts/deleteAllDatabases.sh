#!/bin/bash

echo 'delete databases in mongo and elasticsearch'
tdir=$(pwd)

#script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

./deleteElasticSearchIndexes.sh
./mongoDropAllDatabases.sh