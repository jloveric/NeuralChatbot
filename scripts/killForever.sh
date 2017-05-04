#!/bin/bash

echo "Killing StorebotUI forever run"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
cd ..

echo "Killing StorebotUI"
./node_modules/.bin/forever stop 0
