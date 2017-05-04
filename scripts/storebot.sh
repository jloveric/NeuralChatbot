#!/bin/bash

echo "Running Storebot Server"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
cd ..

node source/run/StorebotUI.js