#!/bin/bash

tdir=$(pwd)

echo "starting up elasticsearch"
elasticsearch/bin/elasticsearch&
esjob=$!

#logstash needs to start after elasticsearch has
#finished startup. 5 seconds is just a guess.
sleep 5

echo "starting up logstash"
cd sqlite-connector
../logstash/bin/logstash -f sqlite.config&
logjob=$!
cd $tdir

echo $esjob
echo $logjob

./runnodeonly.sh

#Killing the spawned processes
kill -9 $esjob
kill -9 $logjob
