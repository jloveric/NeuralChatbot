#!/bin/bash

echo "Running StorebotChat forever"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
cd ..

echo "Running StorebotChat"
./node_modules/.bin/forever start source/run/StoreAi.js
