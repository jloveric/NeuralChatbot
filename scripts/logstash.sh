#!/bin/bash

tdir=$(pwd)

#script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR
cd ..

echo "starting up logstash"
dependencies/logstash/bin/logstash -f uploads/groceries.csv.logstash
logjob=$!
cd $tdir