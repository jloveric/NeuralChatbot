#!/bin/bash

tdir=$(pwd)

#script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR
cd ../dependencies

echo "starting up elasticsearch"
elasticsearch/bin/elasticsearch&
esjob=$!

#logstash needs to start after elasticsearch has
#finished startup. 5 seconds is just a guess.
sleep 10

echo "starting up logstash"
cd ..
dependencies/logstash/bin/logstash -f uploads/groceries.csv.logstash
logjob=$!
cd $tdir

echo $esjob
echo $logjob


#Killing the spawned processes

kill -9 $esjob
kill -9 $logjob
