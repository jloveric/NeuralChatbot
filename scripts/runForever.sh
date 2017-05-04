#!/bin/bash

echo "Running StorebotUI forever"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
cd ..

echo "Starting StorebotUI"
./node_modules/.bin/forever source/run/StoreAi.js
