#!/bin/bash

echo "Running browser tests with nightwatch"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
cd ..

./node_modules/.bin/nightwatch