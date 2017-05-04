#!/bin/bash

echo "Ask a simple question over and over and see what happens"
echo "This test assumes you are already running the server on localhost:8080"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

cd ..

./node_modules/.bin/loadtest -T "application/json" -P '{ "question" : "Where is the tuna"}' -n 10000 -c 10 http://localhost:8080/dbQuestion
