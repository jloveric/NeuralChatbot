#!/bin/bash
#This script just performs coverage testing
#of StoreAi
echo "Checking coverage"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
cd ..

echo "Computing Code Coverage"
node_modules/.bin/istanbul cover jasmine-runner.js
